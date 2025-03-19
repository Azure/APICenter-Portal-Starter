import { useCallback, useEffect, useMemo, useState } from 'react';
import { HttpReqParam } from '@microsoft/api-docs-ui';
import { OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';

interface ReturnType {
  result?: string;
  error?: string;
  isRunning: boolean;
  run: (args: HttpReqParam[]) => Promise<void>;
}

const TEST_RUN_ID = 'test-run';

export default function useMcpTestRunController(deployment?: ApiDeployment, operation?: OperationMetadata): ReturnType {
  const [result, setResult] = useState<string>(undefined);
  const [error, setError] = useState<string>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  const [sseEndpoint, setSseEndpoint] = useState<string>();

  const runtimeUri = deployment?.server.runtimeUri[0];

  const sse = useMemo(() => {
    if (!runtimeUri) {
      return;
    }

    return new EventSource(`${runtimeUri}/sse`);
  }, [runtimeUri]);

  const handleEndpointReceived = useCallback((event: MessageEvent) => {
    setSseEndpoint(event.data);
  }, []);

  const handleMessageReceived = useCallback((event: MessageEvent) => {
    setIsRunning(false);
    try {
      const data = JSON.parse(event.data);

      if (data.error) {
        setError(data.error.message);
        setResult(undefined);
      } else {
        setError(undefined);
        setResult(JSON.stringify(data.result, null, 2));
      }
    } catch {
      setError('Unable to parse result');
    }
  }, []);

  useEffect(() => {
    if (!sse) {
      setSseEndpoint(undefined);
      return;
    }

    sse.addEventListener('endpoint', handleEndpointReceived);
    sse.addEventListener('message', handleMessageReceived);
    return (): void => {
      sse.removeEventListener('endpoint', handleEndpointReceived);
      sse.removeEventListener('message', handleMessageReceived);
    };
  }, [sse, handleEndpointReceived, handleMessageReceived]);

  useEffect(() => {
    setResult(undefined);
    setError(undefined);
    setIsRunning(false);
  }, [operation]);

  const run = useCallback(
    async (args: HttpReqParam[]) => {
      if (isRunning) {
        return;
      }

      try {
        setIsRunning(true);

        void fetch(`${runtimeUri}${sseEndpoint}`, {
          method: 'POST',
          body: JSON.stringify({
            id: TEST_RUN_ID,
            jsonrpc: '2.0',
            method: `${operation.category}/call`,
            params: {
              name: operation.name.split('/').pop(),
              arguments: Object.fromEntries(args.map(({ name, value }) => [name, value])),
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (e) {
        if (e instanceof TypeError) {
          setError(
            'Since the browser initiates the request, it requires Cross-Origin Resource Sharing (CORS) enabled on the server.'
          );
        } else {
          setError('Unable to complete request');
        }
      }
    },
    [isRunning, operation, runtimeUri, sseEndpoint]
  );

  return {
    result,
    error,
    isRunning,
    run,
  };
}
