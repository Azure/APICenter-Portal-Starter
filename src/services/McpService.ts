import { ErrorEvent as EventSourceErrorEvent, EventSource } from 'eventsource';
import { DeferredPromise, makeDeferredPromise } from '@/utils/promise';
import { McpCapabilityTypes, McpInitData, McpOperation, McpResource, McpSpec } from '@/types/mcp';
import { ApiAuthCredentials } from '@/types/apiAuth';
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
 * @param transport - Data API transport metadata.
 * @returns A diagnostic for unsupported explicit metadata; absent metadata enables detection.
 */
export function getUnsupportedMcpTransportMessage(transport?: string | null): string | undefined {
  if (transport != null && transport !== McpTransport.SSE && transport !== McpTransport.StreamableHttp) {
    return `Unsupported MCP transport: ${transport}`;
  }
}

export class McpService {
  public readonly serverUri: string;

  public readonly authCredentials?: ApiAuthCredentials;
  public readonly declaredTransport?: string;
  private transport: McpTransport;
  private closed = false;
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
    this.declaredTransport = transport ?? undefined;
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
      this.initDeferredPromise.reject(new Error(error));
      return;
    }

    this.pendingMessages.set(INIT_ID, makeDeferredPromise());

    if (this.transport === McpTransport.SSE) {
      this.openSseConnection();
    } else {
      void this.initializeStreamableHttp();
    }
  }

  public get isClosed(): boolean {
    return this.closed;
  }

  public closeConnection(): void {
    this.closed = true;
    if (!this.initDeferredPromise.isComplete) {
      this.initDeferredPromise.reject(new Error('MCP connection closed.'));
    }
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
      currentConnectionKey = undefined;
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
    return this.closed ? Promise.reject(new Error('MCP connection closed.')) : this.initDeferredPromise.promise;
  }

  private initializeConnection(): Promise<void> {
    return this.sendRequest<McpInitData>({
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
    }).then(
      (initData) => {
        if (this.closed) return;
        this.initData = initData;
        this.initDeferredPromise.resolve();
      },
      (error) => this.initDeferredPromise.reject(error)
    );
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
      if (this.declaredTransport === undefined && [400, 404, 405].includes(response.status)) {
        this.transport = McpTransport.SSE;
        this.openSseConnection();
        return;
      }

      if (response.status === 401) {
        const wwwAuth = response.headers.get('www-authenticate') || undefined;
        this.initDeferredPromise.reject(new McpUnauthorizedError(undefined, wwwAuth));
        return;
      }

      if (!response.ok) {
        this.initDeferredPromise.reject(new Error(`Initialize failed: ${response.status} ${response.statusText}`));
        return;
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
        this.initData = data.result;
      }

      if (this.closed) return;
      const deferred = this.pendingMessages.get(INIT_ID);
      if (deferred && !deferred.isComplete) {
        deferred.resolve(this.initData);
      }

      this.initDeferredPromise.resolve();
    } catch (err) {
      this.initDeferredPromise.reject(err);
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
    try {
      if (typeof event.data !== 'string' || !event.data) throw new Error('Invalid MCP SSE message endpoint.');
      this.messagingEndpoint = /^https?:\/\//i.test(event.data) ? event.data : new URL(event.data, this.serverUri).href;
      void this.initializeConnection();
    } catch (error) {
      this.messagingEndpoint = undefined;
      this.initDeferredPromise.reject(error);
      this.sse?.close();
    }
  }

  private handleErrorReceived(event: EventSourceErrorEvent): void {
    if (!this.initDeferredPromise.isComplete) {
      this.initDeferredPromise.reject(new Error(`MCP SSE connection failed: ${event.message}`));
      this.sse?.close();
    }
  }

  private openSseConnection(): void {
    try {
      this.sse = new EventSource(this.serverUri, {
        fetch: async (_url, init): Promise<Response> => {
          const response = await this.fetchProxy(this.serverUri, init);
          if (response.status === 401) {
            this.initDeferredPromise.reject(
              new McpUnauthorizedError(undefined, response.headers.get('www-authenticate') || undefined)
            );
          }
          return response;
        },
      });
      this.sse.addEventListener('endpoint', this.handleEndpointReceived);
      this.sse.addEventListener('error', this.handleErrorReceived);
      this.sse.addEventListener('message', this.handleMessageReceived);
    } catch (error) {
      this.initDeferredPromise.reject(error);
    }
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
    const headers = { ...requestInit.headers };
    if (this.authCredentials && this.authCredentials.in === 'header') {
      headers[this.authCredentials.name] = this.authCredentials.value;
    }

    if (!getMcpCorsProxyEnabled()) {
      return fetch(url, {
        ...requestInit,
        headers,
      });
    }

    return apimFetchProxy(url, {
      ...requestInit,
      headers,
    });
  }

  private sendRequest<T = void>(payload: MessagePayload): Promise<T> {
    if (this.closed) return Promise.reject(new Error('MCP connection closed.'));
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
        if (response.status === 401) {
          const wwwAuth = response.headers.get('www-authenticate') || undefined;
          deferred.reject(new McpUnauthorizedError(undefined, wwwAuth));
          return;
        }

        if (!response.ok) {
          deferred.reject(new Error(`Error ${response.status}: ${response.statusText}`));
          return;
        }

        const newSessionId = response.headers.get('mcp-session-id');
        if (newSessionId) {
          this.sessionId = newSessionId;
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream')) {
          const result = await this.parseStreamableResponse<T>(response);
          deferred.resolve(result);
        } else {
          const data = await response.json();
          if (data.error) {
            deferred.reject(data.error);
          } else {
            deferred.resolve(data.result);
          }
        }
      })
      .catch((err) => {
        deferred.reject(err);
      });

    return deferred.promise;
  }

  private sendSseRequest<T = void>(payload: MessagePayload): Promise<T> {
    if (!this.messagingEndpoint) {
      return Promise.reject(new Error('MCP SSE message endpoint is unavailable.'));
    }

    const isInit = payload.id === INIT_ID;
    let deferred: DeferredPromise<T> = this.pendingMessages.get(INIT_ID);
    if (deferred && !deferred.isComplete && !isInit) {
      return Promise.reject(new Error('MCP SSE connection is initializing.'));
    }

    const messageId = payload.id || ++this.lastMessageId;
    if (!deferred || deferred.isComplete) {
      deferred = makeDeferredPromise<T>();
      this.pendingMessages.set(messageId, deferred);
    }

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
        if (response.status === 401) {
          deferred.reject(new McpUnauthorizedError(undefined, response.headers.get('www-authenticate') || undefined));
          return;
        }
        if (!response.ok) {
          deferred.reject(new Error(`Error ${response.status}: ${response.statusText}`));
        }
      })
      .catch((err) => {
        deferred.reject(err);
      });

    return deferred.promise;
  }
}

/**
 * Creates a standalone McpService owned by the caller.
 *
 * Use this when a consumer needs its own connection lifetime (e.g. the test console drawer,
 * which tears the connection down on close) so that closing it doesn't affect the shared
 * instance returned by getMcpService().
 *
 * @param uri - Complete deployment runtime endpoint.
 * @param authCredentials - Optional server credentials.
 * @param transport - Data API transport metadata.
 */
export function createMcpService(
  uri?: string,
  authCredentials?: ApiAuthCredentials,
  transport?: string | null
): McpService | undefined {
  if (!uri) {
    return undefined;
  }

  return new McpService(uri, authCredentials, transport);
}

let currentInstance: McpService | undefined;
let currentConnectionKey: string | undefined;

/**
 * Returns the shared McpService for the given server URI.
 *
 * Omitting `authCredentials` means "reuse whatever is already connected" — it must never
 * downgrade an authenticated instance to an anonymous one.
 *
 * @param uri - Complete deployment runtime endpoint.
 * @param authCredentials - Explicit credentials, or omitted to retain existing credentials.
 * @param transport - Data API transport metadata.
 * @param connectionKey - Stable deployment/definition identity.
 */
export function getMcpService(
  uri?: string,
  authCredentials?: ApiAuthCredentials,
  transport?: string | null,
  connectionKey?: string
): McpService | undefined {
  if (!uri) {
    return undefined;
  }

  const isDifferentServer = currentInstance?.serverUri !== uri;
  const isDifferentTransport = currentInstance?.declaredTransport !== (transport ?? undefined);
  const isDifferentConnection = currentConnectionKey !== connectionKey;
  const isExplicitCredentialsChange =
    !!currentInstance && authCredentials !== undefined && currentInstance.authCredentials !== authCredentials;

  if (isDifferentServer || isDifferentTransport || isDifferentConnection || isExplicitCredentialsChange) {
    currentInstance?.closeConnection();
    currentInstance = new McpService(uri, authCredentials, transport);
    currentConnectionKey = connectionKey;
  }

  return currentInstance;
}
