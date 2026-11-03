import { ErrorEvent as EventSourceErrorEvent, EventSource } from 'eventsource';
import { DeferredPromise, makeDeferredPromise } from '@/utils/promise';
import { McpCapabilityTypes, McpInitData, McpOperation, McpResource, McpSpec } from '@/types/mcp';
import { ApiAuthCredentials } from '@/types/apiAuth';
import { ApiDeployment } from '@/types/apiDeployment';
import { apimFetchProxy } from '@/utils/apimProxy';
import { getMcpCorsProxyEnabled, McpTransport } from '@/constants';

interface MessagePayload {
  id?: number;
  method: string;
  params?: Record<string, unknown>;
}

const INIT_ID = 1;

export class McpUnauthorizedError extends Error {
  public readonly wwwAuthenticate?: string;

  constructor(message?: string, wwwAuthenticate?: string) {
    super(message || 'MCP server returned 401 Unauthorized. Please check your credentials.');
    this.name = 'McpUnauthorizedError';
    this.wwwAuthenticate = wwwAuthenticate;
  }
}

/**
 * @param transport - Data API transport metadata; absent metadata enables compatibility detection.
 * @returns A diagnostic when an explicit transport is unsupported.
 */
export function getUnsupportedMcpTransportMessage(transport?: string | null): string | undefined {
  if (transport != null && transport !== McpTransport.SSE && transport !== McpTransport.StreamableHttp) {
    return `Unsupported MCP transport: ${transport}`;
  }
}

export class McpService {
  public readonly serverUri: string;

  public readonly authCredentials?: ApiAuthCredentials;
  public readonly declaredTransport?: string | null;
  private transport: McpTransport;
  private readonly abortController = new AbortController();
  private closed = false;
  private closeReason: unknown;
  private sse?: EventSource;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingMessages = new Map<number, DeferredPromise<any>>();
  private messagingEndpoint?: string;
  private lastMessageId = INIT_ID;
  private initData: McpInitData;
  private sessionId?: string;

  private initDeferredPromise = makeDeferredPromise<void>();

  constructor(serverUri: string, authCredentials?: ApiAuthCredentials, transport?: string | null) {
    this.authCredentials = authCredentials;
    this.serverUri = serverUri;
    this.declaredTransport = transport;
    this.transport = transport === McpTransport.SSE ? McpTransport.SSE : McpTransport.StreamableHttp;

    // Prevent unhandled promise rejection if init fails before a consumer awaits.
    // Actual errors are still caught when makeApiSpec() calls ensureInitialized().
    this.initDeferredPromise.promise.catch(() => {});

    this.fetchProxy = this.fetchProxy.bind(this);
    this.handleEndpointReceived = this.handleEndpointReceived.bind(this);
    this.handleErrorReceived = this.handleErrorReceived.bind(this);
    this.handleMessageReceived = this.handleMessageReceived.bind(this);

    const error = getUnsupportedMcpTransportMessage(transport);
    if (error) {
      this.closeConnection(new Error(error));
    } else if (this.transport === McpTransport.SSE) {
      this.openSseConnection();
    } else {
      void this.initializeStreamableHttp();
    }
  }

  public get isClosed(): boolean {
    return this.closed;
  }

  public closeConnection(reason: unknown = new Error('MCP connection closed.')): void {
    if (this.closed) return;
    this.closed = true;
    this.closeReason = reason;
    this.abortController.abort();
    if (!this.initDeferredPromise.isComplete) this.initDeferredPromise.reject(reason);
    for (const pending of this.pendingMessages.values()) {
      if (!pending.isComplete) pending.reject(reason);
    }
    this.pendingMessages.clear();
    if (this.sse) {
      this.sse.removeEventListener('endpoint', this.handleEndpointReceived);
      this.sse.removeEventListener('error', this.handleErrorReceived);
      this.sse.removeEventListener('message', this.handleMessageReceived);
      this.sse.close();
    }

    // Only drop the shared instance when this *is* the shared instance. Instances created
    // through createMcpService() are owned by their caller and must not clear it.
    if (currentInstance === this) {
      currentInstance = undefined;
      currentDeployment = undefined;
      currentDefinitionKey = undefined;
    }
  }

  public async collectMcpSpec(): Promise<string> {
    await this.ensureInitialized();

    const spec: McpSpec = {
      prompts: [],
      resources: [],
      tools: [],
    };

    const capabilities = Object.keys(this.initData.capabilities).filter((capability) => capability in spec);

    for (const capability of capabilities) {
      try {
        const res = await this.sendRequest<Record<string, McpOperation[]>>({ method: `${capability}/list` });
        spec[capability] = res[capability];
        if (capability === McpCapabilityTypes.RESOURCES) {
          const templatesRes = await this.sendRequest<Record<string, McpResource[]>>({
            method: `${capability}/templates/list`,
          });
          spec[capability].push(...(templatesRes.resourceTemplates || []));
        }
      } catch {}
    }

    return JSON.stringify(spec);
  }

  public async runTool<T = void>(name: string, args: Record<string, unknown>): Promise<T> {
    await this.ensureInitialized();
    return this.sendRequest<T>({
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    });
  }

  public async getPrompt<T = void>(name: string, args: Record<string, unknown>): Promise<T> {
    await this.ensureInitialized();
    return this.sendRequest<T>({
      method: 'prompts/get',
      params: {
        name,
        arguments: args,
      },
    });
  }

  public async readResource<T = void>(uri: string): Promise<T> {
    await this.ensureInitialized();
    return this.sendRequest<T>({
      method: 'resources/read',
      params: { uri },
    });
  }

  private ensureInitialized(): Promise<void> {
    if (this.closed) return Promise.reject(this.closeReason);
    return this.initDeferredPromise.promise.then(() => {
      if (this.closed) throw this.closeReason;
    });
  }

  private async initializeConnection(): Promise<void> {
    try {
      this.initData = await this.sendRequest<McpInitData>({
        id: INIT_ID,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'apic-mcp-explorer',
            version: '1.0.0',
          },
        },
      });

      if (!this.initData?.capabilities) throw new Error('Invalid MCP initialize response: missing capabilities.');
      if (!this.closed) this.initDeferredPromise.resolve();
    } catch (error) {
      this.closeConnection(error);
    }
  }

  private async initializeStreamableHttp(): Promise<void> {
    try {
      const messageId = INIT_ID;
      const body = JSON.stringify({
        id: messageId,
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'apic-mcp-explorer',
            version: '1.0.0',
          },
        },
      });

      const response = await this.fetchProxy(this.serverUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body,
      });

      if (this.closed) return;
      if (this.declaredTransport == null && [400, 404, 405].includes(response.status)) {
        this.transport = McpTransport.SSE;
        this.openSseConnection();
        return;
      }
      if (!response.ok) {
        throw this.responseError(response);
      }

      const mcpSessionId = response.headers.get('mcp-session-id');
      if (mcpSessionId) {
        this.sessionId = mcpSessionId;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        this.initData = await this.parseStreamableResponse<McpInitData>(response);
      } else {
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || 'MCP initialization failed.');
        this.initData = data.result;
      }

      if (!this.initData?.capabilities) throw new Error('Invalid MCP initialize response: missing capabilities.');
      if (!this.closed) this.initDeferredPromise.resolve();
    } catch (err) {
      this.closeConnection(err);
    }
  }

  private async parseStreamableResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const jsonStr = line.slice(5).trim();
        if (jsonStr) {
          const data = JSON.parse(jsonStr);
          if (data.error) {
            throw data.error;
          }
          return data.result;
        }
      }
    }
    throw new Error('No data event found in SSE response');
  }

  private handleEndpointReceived(event: MessageEvent): void {
    if (this.closed) return;
    try {
      if (typeof event.data !== 'string' || !event.data) throw new Error('Invalid MCP SSE message endpoint.');
      const server = new URL(this.serverUri);
      const endpoint = new URL(event.data, server);
      if (endpoint.origin !== server.origin || endpoint.username || endpoint.password) {
        throw new Error('MCP SSE message endpoint must use the server origin.');
      }
      if (this.messagingEndpoint) {
        if (new URL(this.messagingEndpoint).href !== endpoint.href) {
          throw new Error('MCP SSE message endpoint changed during the connection.');
        }
        return;
      }
      this.messagingEndpoint = /^https?:\/\//i.test(event.data) ? event.data : endpoint.href;
      void this.initializeConnection();
    } catch (error) {
      this.closeConnection(error);
    }
  }

  private handleErrorReceived(event: EventSourceErrorEvent): void {
    const error = new Error(`MCP SSE connection failed: ${event.message || 'connection closed'}`);
    if (!this.initDeferredPromise.isResolved || this.sse?.readyState === EventSource.CLOSED) {
      this.closeConnection(error);
      return;
    }
    this.messagingEndpoint = undefined;
    this.initDeferredPromise = makeDeferredPromise<void>();
    this.initDeferredPromise.promise.catch(() => {});
    for (const pending of this.pendingMessages.values()) {
      if (!pending.isComplete) pending.reject(error);
    }
    this.pendingMessages.clear();
  }

  private openSseConnection(): void {
    if (this.closed) return;
    try {
      this.sse = new EventSource(this.serverUri, {
        fetch: async (_url, init): Promise<Response> => {
          try {
            const response = await this.fetchProxy(this.serverUri, init);
            if (response.status !== 200) this.closeConnection(this.responseError(response));
            return response;
          } catch (error) {
            this.closeConnection(error);
            throw error;
          }
        },
      });
      this.sse.addEventListener('endpoint', this.handleEndpointReceived);
      this.sse.addEventListener('error', this.handleErrorReceived);
      this.sse.addEventListener('message', this.handleMessageReceived);
    } catch (error) {
      this.closeConnection(error);
    }
  }

  private responseError(response: Response): Error {
    return response.status === 401
      ? new McpUnauthorizedError(undefined, response.headers.get('www-authenticate') || undefined)
      : new Error(`Error ${response.status}: ${response.statusText}`);
  }

  private handleMessageReceived(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Ignore messages that are not responses to known requests
      const deferred = this.pendingMessages.get(data.id);
      if (!deferred || deferred.isComplete) {
        return;
      }

      if (data.error) {
        deferred.reject(data.error);
        return;
      }

      deferred.resolve(data.result);
    } catch {
      // Do nothing
    }
  }

  private async fetchProxy(url: string, requestInit?: RequestInit): ReturnType<typeof fetch> {
    const headers = new Headers(requestInit?.headers);
    if (this.authCredentials && this.authCredentials.in === 'header') {
      headers.set(this.authCredentials.name, this.authCredentials.value);
    }
    const init = {
      ...requestInit,
      headers: Object.fromEntries(headers.entries()),
      signal: requestInit?.signal ?? this.abortController.signal,
    };
    return getMcpCorsProxyEnabled() ? apimFetchProxy(url, init) : fetch(url, init);
  }

  private sendRequest<T = void>(payload: MessagePayload): Promise<T> {
    if (this.closed) return Promise.reject(this.closeReason);
    if (this.transport === McpTransport.StreamableHttp) {
      return this.sendStreamableRequest<T>(payload);
    }
    return this.sendSseRequest<T>(payload);
  }

  private sendStreamableRequest<T = void>(payload: MessagePayload): Promise<T> {
    const messageId = payload.id || ++this.lastMessageId;
    const deferred = makeDeferredPromise<T>();
    this.pendingMessages.set(messageId, deferred);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };
    if (this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    this.fetchProxy(this.serverUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: messageId,
        jsonrpc: '2.0',
        params: {},
        ...payload,
      }),
    })
      .then(async (response) => {
        if (deferred.isComplete) return;
        if (!response.ok) {
          deferred.reject(this.responseError(response));
          return;
        }

        const newSessionId = response.headers.get('mcp-session-id');
        if (newSessionId) {
          this.sessionId = newSessionId;
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream')) {
          const result = await this.parseStreamableResponse<T>(response);
          if (!deferred.isComplete) deferred.resolve(result);
        } else {
          const data = await response.json();
          if (data.error) {
            deferred.reject(data.error);
          } else {
            if (!deferred.isComplete) deferred.resolve(data.result);
          }
        }
      })
      .catch((err) => {
        if (!deferred.isComplete) deferred.reject(err);
      });

    return deferred.promise.finally(() => this.pendingMessages.delete(messageId));
  }

  private sendSseRequest<T = void>(payload: MessagePayload): Promise<T> {
    if (!this.messagingEndpoint) {
      return Promise.reject(new Error('MCP SSE message endpoint is unavailable.'));
    }
    const messageId = payload.id || ++this.lastMessageId;
    const deferred = makeDeferredPromise<T>();
    this.pendingMessages.set(messageId, deferred);

    this.fetchProxy(this.messagingEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: messageId,
        jsonrpc: '2.0',
        params: {},
        ...payload,
      }),
    })
      .then((response) => {
        if (!response.ok && !deferred.isComplete) {
          deferred.reject(this.responseError(response));
        }
      })
      .catch((err) => {
        if (!deferred.isComplete) deferred.reject(err);
      });

    return deferred.promise.finally(() => this.pendingMessages.delete(messageId));
  }
}

/**
 * Creates a standalone McpService owned by the caller.
 *
 * Use this when a consumer needs its own connection lifetime (e.g. the test console drawer,
 * which tears the connection down on close) so that closing it doesn't affect the shared
 * instance returned by getMcpService().
 *
 * @param deployment - Deployment with its complete endpoint and transport.
 * @param authCredentials - Credentials sent to the server.
 */
export function createMcpService(
  deployment?: ApiDeployment,
  authCredentials?: ApiAuthCredentials
): McpService | undefined {
  const serverUri = deployment?.server?.runtimeUri?.[0];
  if (!serverUri) {
    return undefined;
  }

  return new McpService(serverUri, authCredentials, deployment.server.mcpTransportProtocol);
}

let currentInstance: McpService | undefined;
let currentDeployment: ApiDeployment | undefined;
let currentDefinitionKey: string | undefined;

/**
 * Returns the shared McpService for the given server URI.
 *
 * Omitting `authCredentials` means "reuse whatever is already connected" — it must never
 * downgrade an authenticated instance to an anonymous one.
 *
 * @param deployment - Deployment with its complete endpoint and transport.
 * @param definitionKey - Definition owning the shared connection.
 * @param authCredentials - Explicit credentials, or omitted to reuse existing credentials.
 */
export function getMcpService(
  deployment?: ApiDeployment,
  definitionKey?: string,
  authCredentials?: ApiAuthCredentials
): McpService | undefined {
  const serverUri = deployment?.server?.runtimeUri?.[0];
  if (!serverUri) {
    return undefined;
  }

  const isDifferentServer = currentInstance?.serverUri !== serverUri;
  const isDifferentDeployment = currentDeployment !== deployment || currentDefinitionKey !== definitionKey;
  const isDifferentTransport = currentInstance?.declaredTransport !== deployment.server.mcpTransportProtocol;
  const isExplicitCredentialsChange =
    !!currentInstance && authCredentials !== undefined && currentInstance.authCredentials !== authCredentials;

  if (
    isDifferentServer ||
    isDifferentDeployment ||
    isDifferentTransport ||
    isExplicitCredentialsChange ||
    currentInstance?.isClosed
  ) {
    currentInstance?.closeConnection();
    currentInstance = new McpService(serverUri, authCredentials, deployment.server.mcpTransportProtocol);
    currentDeployment = deployment;
    currentDefinitionKey = definitionKey;
  }

  return currentInstance;
}
