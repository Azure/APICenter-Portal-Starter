import { EventSource } from 'eventsource';
import { DeferredPromise, makeDeferredPromise } from '@/utils/promise';
import { McpInitData, McpOperation, McpServerAuthMetadata, McpServerPartialAuthMetadata, McpSpec } from '@/types/mcp';
import { ApiAuthCredentials, OAuthGrantTypes } from '@/types/apiAuth';
import { apimFetchProxy } from '@/utils/apimProxy';

interface MessagePayload {
  id?: number;
  method: string;
  params?: Record<string, unknown>;
}

const INIT_ID = 1;

export class McpService {
  private readonly serverOrigin: string;
  public readonly serverUri: string;

  private authCredentials?: ApiAuthCredentials;
  private sse: EventSource;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingMessages = new Map<number, DeferredPromise<any>>();
  private messagingEndpoint?: string;
  private lastMessageId = INIT_ID;
  private initData: McpInitData;

  private authMetadataDeferredPromise = makeDeferredPromise<McpServerAuthMetadata | undefined>();
  private initDeferredPromise = makeDeferredPromise<void>();

  constructor(serverUri: string) {
    this.serverUri = serverUri;
    this.serverOrigin = new URL(serverUri).origin;

    this.fetchProxy = this.fetchProxy.bind(this);
    this.handleEndpointReceived = this.handleEndpointReceived.bind(this);
    this.handleErrorReceived = this.handleErrorReceived.bind(this);
    this.handleMessageReceived = this.handleMessageReceived.bind(this);

    this.pendingMessages.set(INIT_ID, makeDeferredPromise());

    void this.discoverAuthenticationMetadata();
  }

  public setAuthCredentials(authCredentials: ApiAuthCredentials): void {
    this.authCredentials = authCredentials;
    void this.startListeningToSse();
  }

  public getAuthMetadata(): Promise<McpServerAuthMetadata | undefined> {
    return this.authMetadataDeferredPromise.promise;
  }

  public closeConnection(): void {
    this.sse.removeEventListener('endpoint', this.handleEndpointReceived);
    this.sse.removeEventListener('error', this.handleErrorReceived);
    this.sse.removeEventListener('message', this.handleMessageReceived);
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
        const res = await this.sendRequest<McpOperation[]>({ method: `${capability}/list` });
        spec[capability] = res[capability];
      } catch {}
    }

    return JSON.stringify(spec);
  }

  public callTool<T = void>(toolName: string, args: Record<string, unknown>): Promise<T> {
    return this.sendRequest<T>({
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    });
  }

  private startListeningToSse(): void {
    if (this.sse) {
      return;
    }

    this.sse = new EventSource(`${this.serverUri}/sse`, { fetch: this.fetchProxy });

    this.sse.addEventListener('endpoint', this.handleEndpointReceived);
    this.sse.addEventListener('error', this.handleErrorReceived);
    this.sse.addEventListener('message', this.handleMessageReceived);
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

  private async discoverAuthenticationMetadata(): Promise<void> {
    const metadataResponse = await this.fetchProxy(`${this.serverOrigin}/.well-known/oauth-authorization-server`, {
      method: 'GET',
    });

    let metadata: McpServerPartialAuthMetadata | undefined;
    if (metadataResponse.ok) {
      metadata = await metadataResponse.json();
    } else {
      metadata = {
        issuer: this.serverOrigin,
        authorization_endpoint: `${this.serverOrigin}/authorize`,
        token_endpoint: `${this.serverOrigin}/token`,
        registration_endpoint: `${this.serverOrigin}/register`,
        jwks_uri: `${this.serverOrigin}/jwks`,
        scopes_supported: ['openid', 'profile', 'email'],
        response_types_supported: ['code', 'token'],
        grant_types_supported: [OAuthGrantTypes.authorizationCode],
      };
    }

    const registrationResponse = await this.fetchProxy(metadata.registration_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_name: 'APIC MCP Inspector',
        redirect_uris: [window.location.origin],
        response_types: ['code'],
        grant_types: metadata.grant_types_supported,
        token_endpoint_auth_method: 'client_secret_basic',
      }),
    });

    if (registrationResponse.ok) {
      const { client_id } = await registrationResponse.json();
      this.authMetadataDeferredPromise.resolve({ ...metadata, client_id });
      return;
    }

    this.authMetadataDeferredPromise.resolve(undefined);
    this.startListeningToSse();
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

    return apimFetchProxy(url, {
      ...requestInit,
      headers,
    });
  }

  private sendRequest<T = void>(payload: MessagePayload): Promise<T> {
    if (!this.messagingEndpoint) {
      return;
    }

    const isInit = payload.id === INIT_ID;
    let deferred: DeferredPromise<T> = this.pendingMessages.get(INIT_ID);
    if (deferred && !deferred.isComplete && !isInit) {
      // If we are already waiting for this message, don't send it again (ignore for init as it's deferred is pre-created)
      return;
    }

    const messageId = payload.id || ++this.lastMessageId;
    if (!deferred || deferred.isComplete) {
      deferred = makeDeferredPromise<T>();
      this.pendingMessages.set(messageId, deferred);
    }

    let requestUrl = this.messagingEndpoint;
    if (requestUrl.startsWith('/')) {
      requestUrl = `${this.serverOrigin}${requestUrl}`;
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
export default function getMcpService(uri?: string): McpService | undefined {
  let serverUri = uri;
  if (serverUri.endsWith('/sse')) {
    serverUri = serverUri.split('/').slice(0, -1).join('/');
  }

  if (!serverUri) {
    return undefined;
  }

  if (currentInstance?.serverUri !== serverUri) {
    currentInstance?.closeConnection();
    currentInstance = new McpService(serverUri);
  }
  return currentInstance;
}
