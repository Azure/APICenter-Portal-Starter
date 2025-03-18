import { useCallback, useEffect, useMemo, useState } from 'react';
import { McpCapabilitiesByType } from '@/types/mcp';

const SERVER_URL = 'http://localhost:3001';

interface ReturnType extends McpCapabilitiesByType {}

const RPC_IDS = {
  init: 'init',
  getCapability: 'get-capability',
};

export default function useMcpServer(): ReturnType {
  // SSE messaging endpoint
  const [endpoint, setEndpoint] = useState<string>();
  // MCP Server's capabilities metadata by type
  const [capabilities, setCapabilities] = useState<McpCapabilitiesByType>({
    prompts: [],
    resources: [],
    tools: [],
  });

  const sse = useMemo(() => new EventSource(`${SERVER_URL}/sse`), []);

  const sendMessage = useCallback(
    (payload: any) => {
      if (!endpoint) {
        return;
      }

      void fetch(`${SERVER_URL}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    [endpoint]
  );

  const handleEndpointReceived = useCallback((event: MessageEvent) => {
    setEndpoint(event.data);
  }, []);

  const handleMessageReceived = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          // TODO: we should handle it
          return;
        }

        if (data.id === RPC_IDS.init) {
          Object.keys(data.result.capabilities)
            .filter((capability) => capability in capabilities)
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
          setCapabilities((prev) => ({
            ...prev,
            [requestedCapability]: data.result[requestedCapability],
          }));
        }
      } catch {}
    },
    [capabilities, sendMessage]
  );

  useEffect(() => {
    sse.addEventListener('endpoint', handleEndpointReceived);
    sse.addEventListener('message', handleMessageReceived);

    return (): void => {
      sse.removeEventListener('endpoint', handleEndpointReceived);
      sse.removeEventListener('message', handleMessageReceived);
    };
  }, [handleEndpointReceived, handleMessageReceived, sse]);

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  return { ...capabilities };
}
