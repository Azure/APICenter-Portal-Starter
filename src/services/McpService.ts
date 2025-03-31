/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { EventSource } from 'eventsource';
import { DeferredPromise, makeDeferredPromise } from '@/utils/promise';
import { McpOperation, McpSpec } from '@/types/mcp';
import { ApiAuthCredentials } from '@/types/apiAuth';

interface MessagePayload {
  id?: string;
  method: string;
  params?: Record<string, unknown>;
}

type InitData = {
  protocolVersion: string;
  capabilities: Record<string, object>;
  serverInfo: {
    name: string;
    version: string;
  };
};

const INIT_ID = 'init';

export default class McpService {
  private readonly serverUri: string;
  private readonly authCredentials?: ApiAuthCredentials;
  private readonly authHeaders: Record<string, string> = {};
  private sse: EventSource;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingMessages = new Map<string, DeferredPromise<any>>();
  private initDeferredPromise = makeDeferredPromise<void>();
  private messagingEndpoint?: string;
  private lastMessageId = 0;
  private initData: InitData;

  constructor(serverUri: string, authCredentials?: ApiAuthCredentials) {
    this.serverUri = serverUri;
    this.authCredentials = authCredentials;
    this.authHeaders = {
      Authorization: `Bearer ${authCredentials?.value}`,
    };

    if (this.serverUri.endsWith('/sse')) {
      this.serverUri = this.serverUri.split('/').slice(0, -1).join('/');
    }

    // Use the polyfill instead of native EventSource
    this.sse = new EventSource(`${this.serverUri}/sse`, {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${authCredentials?.value}`,
          },
        }),
    });

    this.handleEndpointReceived = this.handleEndpointReceived.bind(this);
    this.handleErrorReceived = this.handleErrorReceived.bind(this);
    this.handleMessageReceived = this.handleMessageReceived.bind(this);

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
      const res = await this.sendRequest<McpOperation[]>({ method: `${capability}/list` });
      spec[capability] = res[capability];
    }

    return JSON.stringify(spec);
  }

  public callTool<T = void>(
    toolName: string,
    args: Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<T> {
    return this.sendRequest<T>(
      {
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      },
      headers
    );
  }

  private ensureInitialized(): Promise<void> {
    return this.initDeferredPromise.promise;
  }

  private async initialize(): Promise<void> {
    this.initData = await this.sendRequest<InitData>(
      {
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
      },
      this.authHeaders
    );

    this.initDeferredPromise.resolve();
  }

  private handleEndpointReceived(event: MessageEvent): void {
    this.messagingEndpoint = event.data;
    void this.initialize();
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

  private sendRequest<T = void>(payload: MessagePayload, authHeaders: Record<string, string> = undefined): Promise<T> {
    if (!this.messagingEndpoint) {
      return Promise.reject(new Error('No messaging endpoint available'));
    }

    // Get the actual message ID for this request
    const messageId = payload.id || String(this.lastMessageId++);
    const isInit = messageId === INIT_ID;

    // Look up the deferred promise using the CORRECT message ID
    let deferred: DeferredPromise<T> = this.pendingMessages.get(messageId);

    // For the init message, we should use the pre-created promise
    if (isInit && !deferred) {
      deferred = this.pendingMessages.get(INIT_ID) as DeferredPromise<T>;
    }

    // If no promise exists or it's already complete, create a new one
    if (!deferred || deferred.isComplete) {
      deferred = makeDeferredPromise<T>();
      this.pendingMessages.set(messageId, deferred);
    }

    // Prepare headers with authentication if available
    const requestHeaders: Record<string, string> = {
      ...(authHeaders ?? this.authHeaders ?? {}),
      'Content-Type': 'application/json',
    };

    fetch(`${this.serverUri}${this.messagingEndpoint}`, {
      method: 'POST',
      body: JSON.stringify({
        id: messageId,
        jsonrpc: '2.0',
        params: {},
        ...payload,
      }),
      headers: requestHeaders,
    }).catch((err) => {
      deferred.reject(err);
    });

    return deferred.promise;
  }
}
