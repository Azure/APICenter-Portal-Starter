import { useCallback, useEffect, useState } from 'react';
import { HttpReqParam } from '@microsoft/api-docs-ui';
import { OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import McpService from '@/services/McpService';

interface ReturnType {
  result?: string;
  error?: string;
  isRunning: boolean;
  run: (args: HttpReqParam[]) => Promise<void>;
}

export default function useMcpTestRunController(
  deployment?: ApiDeployment,
  operation?: OperationMetadata,
  shouldConnect?: boolean
): ReturnType {
  const [mcpService, setMcpService] = useState<McpService>();
  const [result, setResult] = useState<string>(undefined);
  const [error, setError] = useState<string>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const runtimeUri = deployment?.server.runtimeUri[0];
    if (!runtimeUri || !shouldConnect) {
      return;
    }

    setMcpService((prev) => {
      prev?.closeConnection();
      return new McpService(deployment?.server.runtimeUri[0]);
    });
  }, [deployment?.server.runtimeUri, shouldConnect]);

  useEffect(() => {
    if (!shouldConnect && mcpService) {
      mcpService.closeConnection();
    }
  }, [mcpService, shouldConnect]);

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

        const toolName = operation.name.split('/').pop();
        const toolArgs = Object.fromEntries(args.map(({ name, value }) => [name, value]));
        const result = await mcpService.callTool(toolName, toolArgs);

        setError(undefined);
        setResult(JSON.stringify(result, null, 2));
      } catch (e) {
        if (e instanceof TypeError) {
          setError(
            'Since the browser initiates the request, it requires Cross-Origin Resource Sharing (CORS) enabled on the server.'
          );
        } else {
          setError('Unable to complete request');
        }
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, mcpService, operation.name]
  );

  return {
    result,
    error,
    isRunning,
    run,
  };
}
