import { ErrorEvent as EventSourceErrorEvent, EventSource } from 'eventsource';
import { createParser } from 'eventsource-parser';
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

interface JsonRpcResponse<T> {
  id?: number | string | null;
  method?: string;
  result?: T;
  error?: { message?: string };
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
 * Returns a diagnostic for an explicitly unsupported deployment transport.
 *
 * @param transport - Transport metadata from the Data API.
 * @returns A diagnostic, or undefined when the transport is supported or absent.
 */
export function getUnsupportedMcpTransportMessage(transport?: string | null): string | undefined {
  if (transport == null || transport === McpTransport.SSE || transport === McpTransport.StreamableHttp) {
    return undefined;
  }
  return `Unsupported MCP transport: ${String(transport)}`;
}

export class McpService {
  public readonly serverUri: string;

  public readonly authCredentials?: ApiAuthCredentials;
  public readonly declaredTransport?: string | null;
  private sse?: EventSource;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingMessages = new Map<number, DeferredPromise<any>>();
  private messagingEndpoint?: string;
  private transport?: McpTransport;
  private lastMessageId = INIT_ID;
  private initData: McpInitData;
  private sessionId?: string;
  private readonly abortController = new AbortController();
  private closed = false;
  private closeReason: unknown;

  private initDeferredPromise = makeDeferredPromise<void>();

  constructor(serverUri: string, authCredentials?: ApiAuthCredentials, transport?: string | null) {
    this.authCredentials = authCredentials;
    this.serverUri = serverUri;
    this.declaredTransport = transport;

    // Prevent unhandled promise rejection if init fails before a consumer awaits.
    // Actual errors are still caught when makeApiSpec() calls ensureInitialized().
    this.initDeferredPromise.promise.catch(() => {});

    this.fetchProxy = this.fetchProxy.bind(this);
    this.handleEndpointReceived = this.handleEndpointReceived.bind(this);
    this.handleErrorReceived = this.handleErrorReceived.bind(this);
    this.handleMessageReceived = this.handleMessageReceived.bind(this);

    const transportError = getUnsupportedMcpTransportMessage(transport);
    if (transportError) {
      this.terminate(new Error(transportError));
      return;
    }

    if (transport === McpTransport.SSE) {
      this.transport = McpTransport.SSE;
      this.openSseConnection();
    } else if (transport === McpTransport.StreamableHttp) {
      void this.initializeStreamableHttp(false);
    } else {
      void this.initializeStreamableHttp(true);
    }
  }

  public get isClosed(): boolean {
    return this.closed;
  }

  public closeConnection(): void {
    this.terminate(new Error('MCP connection closed.'));
  }

  private terminate(reason: unknown): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.closeReason = reason;
    this.abortController.abort();

    if (this.sse) {
      this.sse.removeEventListener('endpoint', this.handleEndpointReceived);
      this.sse.removeEventListener('error', this.handleErrorReceived);
      this.sse.removeEventListener('message', this.handleMessageReceived);
      this.sse.close();
    }

    if (!this.initDeferredPromise.isComplete) {
      this.initDeferredPromise.reject(reason);
    }
    for (const deferred of this.pendingMessages.values()) {
      if (!deferred.isComplete) {
        deferred.reject(reason);
      }
    }
    this.pendingMessages.clear();

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
    if (this.closed) {
      return Promise.reject(this.closeReason);
    }

    return this.initDeferredPromise.promise.then(() => {
      if (this.closed) {
        throw this.closeReason;
      }
    });
  }

  private initializePayload(): MessagePayload {
    return {
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
    };
  }

  private acceptInitialization(initData: McpInitData): void {
    if (!initData || typeof initData.capabilities !== 'object' || !initData.capabilities) {
      throw new Error('Invalid MCP initialize response: missing capabilities.');
    }
    this.initData = initData;
    this.initDeferredPromise.resolve();
  }

  private async initializeConnection(): Promise<void> {
    try {
      const initData = await this.sendSseRequest<McpInitData>(this.initializePayload());
      if (!this.closed) {
        this.acceptInitialization(initData);
      }
    } catch (error) {
      this.terminate(error);
    }
  }

  private async initializeStreamableHttp(allowSseFallback: boolean): Promise<void> {
    try {
      const response = await this.fetchProxy(this.serverUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({ jsonrpc: '2.0', ...this.initializePayload() }),
        signal: this.abortController.signal,
      });

      if (this.closed) {
        return;
      }

      if (allowSseFallback && [400, 404, 405].includes(response.status)) {
        this.transport = McpTransport.SSE;
        this.openSseConnection();
        return;
      }

      if (!response.ok) {
        throw this.responseError(response, 'Initialize failed');
      }

      const mcpSessionId = response.headers.get('mcp-session-id');
      if (mcpSessionId) {
        this.sessionId = mcpSessionId;
      }

      const initData = await this.parseResponse<McpInitData>(response, INIT_ID);
      if (!this.closed) {
        this.transport = McpTransport.StreamableHttp;
        this.acceptInitialization(initData);
      }
    } catch (error) {
      this.terminate(error);
    }
  }

  private responseError(response: Response, prefix: string): Error {
    if (response.status === 401) {
      return new McpUnauthorizedError(undefined, response.headers.get('www-authenticate') || undefined);
    }
    return new Error(`${prefix}: ${response.status} ${response.statusText}`.trim());
  }

  private async parseResponse<T>(response: Response, requestId: number): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      return this.parseStreamableResponse<T>(response, requestId);
    }
    return this.readJsonRpcResult<T>(await response.json());
  }

  private readJsonRpcResult<T>(data: JsonRpcResponse<T>): T {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid MCP JSON-RPC response.');
    }
    if (data.error) {
      throw new Error(data.error.message || 'MCP server returned a JSON-RPC error.');
    }
    if (!Object.prototype.hasOwnProperty.call(data, 'result')) {
      throw new Error('Invalid MCP JSON-RPC response: missing result.');
    }
    return data.result;
  }

  private async parseStreamableResponse<T>(response: Response, requestId: number): Promise<T> {
    if (!response.body) {
      throw new Error('Invalid MCP event-stream response: missing body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result: { value: T } | undefined;
    let canceled = false;
    const cancelReader = (): void => {
      if (!canceled) {
        canceled = true;
        void reader.cancel().catch((error) => console.warn('Failed to cancel MCP response stream:', error));
      }
    };
    const parser = createParser({
      onEvent: ({ data }) => {
        if (result) {
          return;
        }
        const message: JsonRpcResponse<T> = JSON.parse(data);
        if (message && typeof message === 'object' && message.id === requestId && !message.method) {
          result = { value: this.readJsonRpcResult<T>(message) };
        }
      },
    });

    this.abortController.signal.addEventListener('abort', cancelReader, { once: true });
    try {
      while (!result) {
        const { done, value } = await reader.read();
        if (this.closed) {
          throw this.closeReason;
        }
        if (done) {
          parser.feed(decoder.decode());
          break;
        }
        parser.feed(decoder.decode(value, { stream: true }));
      }
      if (!result) {
        throw new Error('No matching JSON-RPC response found in MCP event stream.');
      }
      return result.value;
    } finally {
      this.abortController.signal.removeEventListener('abort', cancelReader);
      cancelReader();
      reader.releaseLock();
    }
  }

  private openSseConnection(): void {
    if (this.closed) {
      return;
    }

    try {
      this.sse = new EventSource(this.serverUri, {
        fetch: (_url, requestInit): Promise<Response> => this.fetchSse(requestInit),
      });
      this.sse.addEventListener('endpoint', this.handleEndpointReceived);
      this.sse.addEventListener('error', this.handleErrorReceived);
      this.sse.addEventListener('message', this.handleMessageReceived);
    } catch (error) {
      this.terminate(error);
    }
  }

  private async fetchSse(requestInit?: RequestInit): Promise<Response> {
    try {
      const response = await this.fetchProxy(this.serverUri, requestInit);
      if (!this.closed && response.status !== 200) {
        this.terminate(this.responseError(response, 'MCP SSE connection failed'));
      }
      return response;
    } catch (error) {
      this.terminate(error);
      throw error;
    }
  }

  private handleEndpointReceived(event: MessageEvent): void {
    if (this.closed) {
      return;
    }

    try {
      if (typeof event.data !== 'string' || !event.data) {
        throw new Error('MCP SSE server supplied an invalid message endpoint.');
      }
      const serverUrl = new URL(this.serverUri);
      const endpointUrl = new URL(event.data, serverUrl);
      if (endpointUrl.origin !== serverUrl.origin || endpointUrl.username || endpointUrl.password) {
        throw new Error('MCP SSE message endpoint must use the server origin.');
      }
      const endpoint = /^https?:\/\//i.test(event.data) ? event.data : endpointUrl.href;
      if (this.messagingEndpoint) {
        if (new URL(this.messagingEndpoint).href !== endpointUrl.href) {
          throw new Error('MCP SSE message endpoint changed during the connection.');
        }
        return;
      }
      this.messagingEndpoint = endpoint;
      void this.initializeConnection();
    } catch (error) {
      this.terminate(error);
    }
  }

  private handleErrorReceived(event: EventSourceErrorEvent): void {
    const error = new Error(`MCP SSE connection failed: ${event.message || 'connection closed'}`);
    if (!this.initDeferredPromise.isResolved || this.sse?.readyState === EventSource.CLOSED) {
      this.terminate(error);
      return;
    }

    this.messagingEndpoint = undefined;
    this.initDeferredPromise = makeDeferredPromise<void>();
    this.initDeferredPromise.promise.catch(() => {});
    for (const deferred of this.pendingMessages.values()) {
      if (!deferred.isComplete) {
        deferred.reject(error);
      }
    }
    this.pendingMessages.clear();
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
        deferred.reject(new Error(data.error.message || 'MCP server returned a JSON-RPC error.'));
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

    const init = { ...requestInit, headers: Object.fromEntries(headers.entries()) };
    if (!getMcpCorsProxyEnabled()) {
      return fetch(url, init);
    }

    return apimFetchProxy(url, init);
  }

  private sendRequest<T = void>(payload: MessagePayload): Promise<T> {
    if (this.closed) {
      return Promise.reject(this.closeReason);
    }
    if (this.transport === McpTransport.StreamableHttp) {
      return this.sendStreamableRequest<T>(payload);
    }
    if (this.transport === McpTransport.SSE) {
      return this.sendSseRequest<T>(payload);
    }
    return Promise.reject(new Error('MCP transport has not been initialized.'));
  }

  private async sendStreamableRequest<T = void>(payload: MessagePayload): Promise<T> {
    const messageId = payload.id || ++this.lastMessageId;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };
    if (this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    const response = await this.fetchProxy(this.serverUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: messageId,
        jsonrpc: '2.0',
        params: {},
        ...payload,
      }),
      signal: this.abortController.signal,
    });
    if (this.closed) {
      throw this.closeReason;
    }
    if (!response.ok) {
      throw this.responseError(response, 'MCP request failed');
    }

    const newSessionId = response.headers.get('mcp-session-id');
    if (newSessionId) {
      this.sessionId = newSessionId;
    }
    const result = await this.parseResponse<T>(response, messageId);
    if (this.closed) {
      throw this.closeReason;
    }
    return result;
  }

  private sendSseRequest<T = void>(payload: MessagePayload): Promise<T> {
    if (this.closed) {
      return Promise.reject(this.closeReason);
    }
    if (!this.messagingEndpoint) {
      return Promise.reject(new Error('MCP SSE message endpoint is unavailable.'));
    }

    const messageId = payload.id || ++this.lastMessageId;
    const deferred = makeDeferredPromise<T>();
    this.pendingMessages.set(messageId, deferred);

    void this.fetchProxy(this.messagingEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: messageId,
        jsonrpc: '2.0',
        params: {},
        ...payload,
      }),
      signal: this.abortController.signal,
    })
      .then((response) => {
        if (!response.ok && !deferred.isComplete) {
          deferred.reject(this.responseError(response, 'MCP request failed'));
        }
      })
      .catch((err) => {
        if (!deferred.isComplete) {
          deferred.reject(err);
        }
      });

    return deferred.promise.finally(() => {
      this.pendingMessages.delete(messageId);
    });
  }
}

/**
 * Creates a standalone McpService owned by the caller.
 *
 * Use this when a consumer needs its own connection lifetime (e.g. the test console drawer,
 * which tears the connection down on close) so that closing it doesn't affect the shared
 * instance returned by getMcpService().
 *
 * @param deployment - Deployment containing the exact runtime endpoint and transport.
 * @param authCredentials - Optional credentials to send to the MCP server.
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
 * @param deployment - Deployment containing the exact runtime endpoint and transport.
 * @param definitionKey - Identity of the API definition using this connection.
 * @param authCredentials - Optional credentials to send to the MCP server.
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
    !currentInstance ||
    currentInstance.isClosed ||
    isDifferentServer ||
    isDifferentDeployment ||
    isDifferentTransport ||
    isExplicitCredentialsChange
  ) {
    currentInstance?.closeConnection();
    currentInstance = new McpService(serverUri, authCredentials, deployment.server.mcpTransportProtocol);
    currentDeployment = deployment;
    currentDefinitionKey = definitionKey;
  }

  return currentInstance;
}
