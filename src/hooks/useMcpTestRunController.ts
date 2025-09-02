import { useCallback, useEffect, useState } from 'react';
import { HttpReqParam } from '@microsoft/api-docs-ui';
import { OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import { getMcpService, McpService } from '@/services/McpService';
import { McpCapabilityTypes } from '@/types/mcp';

interface ReturnType {
  result?: string;
  error?: string;
  isRunning: boolean;
  run: (args: HttpReqParam[]) => Promise<void>;
}

// TODO: migrate to react-query mutation
export function useMcpTestRunController(
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
      // return getMcpService(deployment?.server.runtimeUri[0]);
      return getMcpService('http://localhost:3000');
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

        const name = operation.name.split('/').pop();
        const operationArguments = Object.fromEntries(args.map(({ name, value }) => [name, value]));

        switch (operation.category) {
          case McpCapabilityTypes.TOOLS: {
            const result = await mcpService.runTool(name, operationArguments);
            setResult(JSON.stringify(result, null, 2));
            break;
          }

          case McpCapabilityTypes.PROMPTS: {
            const result = await mcpService.getPrompt(name, operationArguments);
            setResult(JSON.stringify(result, null, 2));
            break;
          }

          case McpCapabilityTypes.RESOURCES: {
            const result = await mcpService.readResource(operationArguments.uri);
            setResult(JSON.stringify(result, null, 2));
            break;
          }

          default:
            throw new Error(`Unsupported MCP capability type: ${operation.category}`);
        }

        setError(undefined);
      } catch (e) {
        setResult(undefined);

        if (e instanceof TypeError) {
          setError(
            'Since the browser initiates the request, it requires Cross-Origin Resource Sharing (CORS) enabled on the server.'
          );
        } else {
          setError(e.message || 'Unable to complete request');
        }
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, mcpService, operation]
  );

  return {
    result,
    error,
    isRunning,
    run,
  };
}
