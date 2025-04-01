/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { fetchEventSource, EventSourceMessage } from '@sentool/fetch-event-source';
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
  private controller: AbortController | null = null;
  private pendingMessages = new Map<string, DeferredPromise<any>>();
  private initDeferredPromise = makeDeferredPromise<void>();
  private messagingEndpoint?: string;
  private lastMessageId = 0;
  private initData: InitData;
  private connected: boolean = false;
  private connectionPromise: Promise<any>;

  constructor(serverUri: string, authCredentials?: ApiAuthCredentials) {
    // Keep server URI as is per request
    this.serverUri = 'http://localhost:3002';
    console.log('Initializing McpService with server URI:', this.serverUri);

    this.authCredentials = authCredentials;

    // Format the auth header properly
    if (authCredentials?.value) {
      const authValue = authCredentials.value.trim();
      this.authHeaders = {
        Authorization: authValue.startsWith('Bearer ') ? authValue : `Bearer ${authValue}`,
      };
      console.log('Using auth headers:', Object.keys(this.authHeaders));
    } else {
      console.log('No auth credentials provided');
    }

    if (this.serverUri.endsWith('/sse')) {
      this.serverUri = this.serverUri.split('/').slice(0, -1).join('/');
    }

    this.pendingMessages.set(INIT_ID, makeDeferredPromise());

    // Set up connection promise
    this.connectionPromise = this.establishConnection();
  }

  private establishConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log(`Establishing connection to ${this.serverUri}/sse`);

      // Define the message processor
      const processMessage = (message: EventSourceMessage) => {
        console.log('Message received:', message.event);

        if (message.event === 'endpoint') {
          console.log('Endpoint received:', message.data);
          this.messagingEndpoint = message.data;

          // Initialize with the endpoint
          void this.initialize();
        }

        if (message.event === 'message') {
          try {
            const data = message.data;

            if (data === 'Accepted') {
              return;
            }
            console.log('Message data received:', data.id);

            // Find the deferred promise for this message ID
            const deferred = this.pendingMessages.get(data.id);
            if (deferred && !deferred.isComplete) {
              if (data.error) {
                deferred.reject(data.error);
              } else {
                deferred.resolve(data.result);
              }
            }
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        }
      };

      // Create basic headers
      const headers: Record<string, string> = {
        'Content-Type': 'text/event-stream',
      };

      // Add auth headers if available
      if (this.authCredentials?.value) {
        headers.Authorization = this.authHeaders.Authorization;
      }

      console.log('Connection headers:', Object.keys(headers));

      // Set up the controller for aborting the connection
      this.controller = new AbortController();

      // And before using fetchEventSource
console.log('Final headers for SSE connection:', 
  Object.entries(headers).map(([key, value]) => 
    `${key}: ${value ? value.substring(0, 5) + '...' : 'EMPTY'}`
  ));

      // Create the event source
      fetchEventSource(`${this.serverUri}/sse`, {
        method: 'GET',
        headers: headers,
        signal: this.controller.signal,

        onopen: (response) => {
          console.log('Request has been opened with status:', response.status);
          if (response.ok) {
            console.log('Connection established successfully');
            this.connected = true;
            resolve(true);
          } else {
            const error = new Error(`Failed to connect: ${response.status}`);
            console.error(error);
            reject(error);
          }
        },

        onmessage: (message) => {
          processMessage(message);
        },

        onclose: () => {
          console.log('Connection closed');
          this.connected = false;
        },

        onerror: (error) => {
          console.error('Error occurred:', error);
          this.connected = false;
          reject(error);
        },
      }).catch((error) => {
        console.error('Connection failed:', error);
        reject(error);
      });
    });
  }

  public closeConnection(): void {
    if (this.controller) {
      console.log('Closing SSE connection');
      this.controller.abort();
      this.controller = null;
    }
    this.connected = false;
  }

  public async collectMcpSpec(): Promise<string> {
    await this.ensureInitialized();

    console.log('Collecting MCP spec...');

    const spec: McpSpec = {
      prompts: [],
      resources: [],
      tools: [],
    };

    if (!this.initData || !this.initData.capabilities) {
      throw new Error('Server did not return capabilities data during initialization');
    }

    const capabilities = Object.keys(this.initData.capabilities).filter((capability) => capability in spec);
    console.log('Capabilities to fetch:', capabilities);

    for (const capability of capabilities) {
      console.log(`Listing ${capability}...`);
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

  private ensureInitialized(timeoutMs = 15000): Promise<void> {
    return this.initDeferredPromise.promise;
  }

  private async initialize(): Promise<void> {
    console.log('Initializing with endpoint:', this.messagingEndpoint);

    try {
      this.initData = await this.sendRequest<InitData>({
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

      console.log('Initialization successful:', this.initData);
      this.initDeferredPromise.resolve();
    } catch (error) {
      console.error('Initialization failed:', error);
      this.initDeferredPromise.reject(error);
      throw error;
    }
  }

  private sendRequest<T = void>(payload: MessagePayload, authHeaders?: Record<string, string>): Promise<T> {
    if (!this.messagingEndpoint) {
      return Promise.reject(new Error('No messaging endpoint available'));
    }

    // Get the actual message ID for this request
    const messageId = payload.id || String(this.lastMessageId++);
    const isInit = messageId === INIT_ID;

    // Look up the deferred promise using the message ID
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

    const requestBody = {
      method: payload.method,
      params: payload.params || {},
      jsonrpc: '2.0',
      id: messageId,
    };

    console.log(`Sending request to ${this.serverUri}${this.messagingEndpoint}:`, requestBody);

    // Post the request to the endpoint
    fetch(`${this.serverUri}${this.messagingEndpoint}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        return response.text();
      })
      .then((data) => {
        console.log('Response received:', data);

        if (data === 'Accepted') {
          return;
        }
        
        // Parse the response as JSON
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (err) {
          console.error('Failed to parse response:', err);
          deferred.reject(new Error('Failed to parse response'));
          return;
        }

        if (parsedData.error) {
          deferred.reject(parsedData.error);
        } else {
          deferred.resolve(parsedData.result);
        }
      })
      .catch((error) => {
        console.error('Request failed:', error);
        deferred.reject(error);
      });

    return deferred.promise;
  }
}
