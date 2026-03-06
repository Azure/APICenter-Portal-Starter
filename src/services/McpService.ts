import { EventSource } from 'eventsource';
import { DeferredPromise, makeDeferredPromise } from '@/utils/promise';
import { McpCapabilityTypes, McpInitData, McpOperation, McpResource, McpSpec } from '@/types/mcp';
import { ApiAuthCredentials } from '@/types/apiAuth';
import { apimFetchProxy } from '@/utils/apimProxy';
import { useCorsProxy, mcpTransport, McpTransport } from '@/constants';

interface MessagePayload {
  id?: number;
  method: string;
  params?: Record<string, unknown>;
}

const INIT_ID = 1;

export class McpUnauthorizedError extends Error {
  constructor(message = 'MCP server returned 401 Unauthorized. Please check your credentials.') {
    super(message);
    this.name = 'McpUnauthorizedError';
  }
}

export class McpService {
  public readonly serverUri: string;

  public readonly authCredentials?: ApiAuthCredentials;
  private sse?: EventSource;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingMessages = new Map<number, DeferredPromise<any>>();
  private messagingEndpoint?: string;
  private lastMessageId = INIT_ID;
  private initData: McpInitData;
  private sessionId?: string;

  private initDeferredPromise = makeDeferredPromise<void>();

  constructor(serverUri: string, authCredentials?: ApiAuthCredentials) {
    this.authCredentials = authCredentials;

    this.serverUri = serverUri;

    this.fetchProxy = this.fetchProxy.bind(this);
    this.handleEndpointReceived = this.handleEndpointReceived.bind(this);
    this.handleErrorReceived = this.handleErrorReceived.bind(this);
    this.handleMessageReceived = this.handleMessageReceived.bind(this);

    this.pendingMessages.set(INIT_ID, makeDeferredPromise());

    if (mcpTransport === McpTransport.SSE) {
      const sseUrl = useCorsProxy ? `${this.serverUri}/sse` : this.serverUri;
      this.sse = new EventSource(sseUrl, { fetch: this.fetchProxy });

      this.sse.addEventListener('endpoint', this.handleEndpointReceived);
      this.sse.addEventListener('error', this.handleErrorReceived);
      this.sse.addEventListener('message', this.handleMessageReceived);
    } else {
      void this.initializeStreamableHttp();
    }
  }

  public closeConnection(): void {
    if (this.sse) {
      this.sse.removeEventListener('endpoint', this.handleEndpointReceived);
      this.sse.removeEventListener('error', this.handleErrorReceived);
      this.sse.removeEventListener('message', this.handleMessageReceived);
    }
    currentInstance = undefined;
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
    return this.initDeferredPromise.promise;
  }

  private async initializeConnection(): Promise<void> {
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

    this.initDeferredPromise.resolve();
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

      if (response.status === 401) {
        this.initDeferredPromise.reject(new McpUnauthorizedError());
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
    this.messagingEndpoint = event.data;
    void this.initializeConnection();
  }

  private handleErrorReceived(event: MessageEvent): void {
    if (!this.initDeferredPromise.isComplete) {
      this.initDeferredPromise.reject(event);
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

    if (!useCorsProxy) {
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
    if (mcpTransport === McpTransport.StreamableHttp) {
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
          deferred.reject(new McpUnauthorizedError());
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
      return;
    }

    const isInit = payload.id === INIT_ID;
    let deferred: DeferredPromise<T> = this.pendingMessages.get(INIT_ID);
    if (deferred && !deferred.isComplete && !isInit) {
      return;
    }

    const messageId = payload.id || ++this.lastMessageId;
    if (!deferred || deferred.isComplete) {
      deferred = makeDeferredPromise<T>();
      this.pendingMessages.set(messageId, deferred);
    }

    let requestUrl = this.messagingEndpoint;
    if (requestUrl.startsWith('/')) {
      const origin = new URL(this.serverUri).origin;
      requestUrl = `${origin}${requestUrl}`;
    }

    this.fetchProxy(requestUrl, {
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

let currentInstance: McpService | undefined;
export function getMcpService(uri?: string, authCredentials?: ApiAuthCredentials): McpService | undefined {
  let serverUri = uri;
  if (serverUri.endsWith('/sse')) {
    serverUri = serverUri.split('/').slice(0, -1).join('/');
  }

  if (!serverUri) {
    return undefined;
  }

  if (currentInstance?.serverUri !== serverUri) {
    currentInstance?.closeConnection();
    currentInstance = new McpService(serverUri, authCredentials);
  }

  if (currentInstance && currentInstance.authCredentials !== authCredentials) {
    // We should avoid such situations as they may lead to unexpected behavior
    throw new Error('MCP service is already initialized at provided URL with different credentials');
  }

  return currentInstance;
}
