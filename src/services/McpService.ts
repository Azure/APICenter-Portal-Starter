import { EventSource } from 'eventsource';
import { getRecoil } from 'recoil-nexus';
import { DeferredPromise, makeDeferredPromise } from '@/utils/promise';
import { McpInitData, McpOperation, McpSpec } from '@/types/mcp';
import appServicesAtom from '@/atoms/appServicesAtom';

interface MessagePayload {
  id?: number;
  method: string;
  params?: Record<string, unknown>;
}

const INIT_ID = 1;
const CorsProxyEndpoint = 'https://apimanagement-cors-proxy-df.azure-api.net/sendrequest';

export default class McpService {
  private readonly serverUri: string;
  private sse: EventSource;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingMessages = new Map<number, DeferredPromise<any>>();
  private initDeferredPromise = makeDeferredPromise<void>();
  private messagingEndpoint?: string;
  private lastMessageId = INIT_ID;
  private initData: McpInitData;

  constructor(serverUri: string) {
    this.serverUri = serverUri;
    if (this.serverUri.endsWith('/sse')) {
      this.serverUri = this.serverUri.split('/').slice(0, -1).join('/');
    }

    this.fetchProxy = this.fetchProxy.bind(this);
    this.handleEndpointReceived = this.handleEndpointReceived.bind(this);
    this.handleErrorReceived = this.handleErrorReceived.bind(this);
    this.handleMessageReceived = this.handleMessageReceived.bind(this);

    this.sse = new EventSource(`${this.serverUri}/sse`, { fetch: this.fetchProxy });

    this.sse.addEventListener('endpoint', this.handleEndpointReceived);
    this.sse.addEventListener('error', this.handleErrorReceived);
    this.sse.addEventListener('message', this.handleMessageReceived);

    this.pendingMessages.set(INIT_ID, makeDeferredPromise());
  }

  public closeConnection(): void {
    this.sse.removeEventListener('endpoint', this.handleEndpointReceived);
    this.sse.removeEventListener('error', this.handleErrorReceived);
    this.sse.removeEventListener('message', this.handleMessageReceived);
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
      } catch { }
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

  private handleEndpointReceived(event: MessageEvent): void {
    this.messagingEndpoint = event.data;
    void this.initializeConnection();
  }

  private handleErrorReceived(event: MessageEvent): void {
    if (!this.initDeferredPromise.isComplete) {
      this.initDeferredPromise.reject(event);
    }
    this.closeConnection();
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

  private async fetchProxy(url: string, requestInit: RequestInit): ReturnType<typeof fetch> {
    const { AuthService, ConfigService } = getRecoil(appServicesAtom);
    const accessToken = await AuthService.getAccessToken();
    const settings = await ConfigService.getSettings();
    const serviceName = settings.dataApiHostName.split('.')[0];

    return fetch(CorsProxyEndpoint, {
      method: 'POST',
      ...requestInit,
      headers: {
        ...requestInit.headers,
        'Ocp-Apim-Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Service-Name': serviceName,
        'Ocp-Apim-Method': requestInit.method,
        'Ocp-Apim-Url': url,
      },
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

    this.fetchProxy(`${this.serverUri}${this.messagingEndpoint}`, {
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
        if (response.status >= 400) {
          deferred.reject(new Error(`Error ${response.status}: ${response.statusText}`));
        }
      })
      .catch((err) => {
        deferred.reject(err);
      });

    return deferred.promise;
  }
}
