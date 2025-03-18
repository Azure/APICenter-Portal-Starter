import { McpSpec } from '@/types/mcp';

const RPC_IDS = {
  init: 'init',
  getCapability: 'get-capability',
};

export function collectMcpSpec(serverUri: string): Promise<string> {
  return new Promise((resolve) => {
    // TODO: only SSE is supported right now. Do we need to support other protocols?
    const sse = new EventSource(`${serverUri}/sse`);

    const pendingMessages = new Set<string>();
    let endpoint: string;

    const spec: McpSpec = {
      prompts: [],
      resources: [],
      tools: [],
    };

    function initialize(): void {
      sse.addEventListener('endpoint', handleEndpointReceived);
      sse.addEventListener('message', handleMessageReceived);
    }

    function finalize(): void {
      sse.removeEventListener('endpoint', handleEndpointReceived);
      sse.removeEventListener('message', handleMessageReceived);

      resolve(JSON.stringify(spec));
    }

    function sendMessage(payload: any): void {
      if (!endpoint) {
        return;
      }

      pendingMessages.add(payload.id);

      void fetch(`${serverUri}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    function handleEndpointReceived(event: MessageEvent): void {
      endpoint = event.data;

      sendMessage({
        id: RPC_IDS.init,
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
    }

    function handleMessageReceived(event: MessageEvent): void {
      try {
        const data = JSON.parse(event.data);
        pendingMessages.delete(data.id);
        if (data.error) {
          // TODO: we should handle it
          return;
        }

        if (data.id === RPC_IDS.init) {
          Object.keys(data.result.capabilities)
            .filter((capability) => capability in spec)
            .forEach((capability) => {
              sendMessage({
                id: `${RPC_IDS.getCapability}-${capability}`,
                jsonrpc: '2.0',
                method: `${capability}/list`,
                params: {},
              });
            });
        }

        if (data.id.startsWith(RPC_IDS.getCapability)) {
          const requestedCapability = data.id.split('-').pop();
          spec[requestedCapability] = data.result[requestedCapability];
        }
      } finally {
        if (!pendingMessages.size) {
          finalize();
        }
      }
    }

    initialize();
  });
}
