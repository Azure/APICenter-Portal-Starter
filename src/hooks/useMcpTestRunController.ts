import { useCallback, useEffect, useRef, useState } from 'react';
import { HttpReqParam } from 'api-docs-ui';
import { OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import { createMcpService, McpService } from '@/services/McpService';
import { McpCapabilityTypes, McpTool } from '@/types/mcp';
import { useMcpAuthCredentials } from '@/contexts/McpAuthContext';
import { convertMcpToolArguments } from '@/utils/mcpArguments';

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
  const activeDeployment = useRef<ApiDeployment>();
  const connectionVersion = useRef(0);
  const operationVersion = useRef(0);

  const authCredentials = useMcpAuthCredentials();
  const runtimeUri = deployment?.server?.runtimeUri?.[0];
  const transport = deployment?.server?.mcpTransportProtocol;

  useEffect(() => {
    connectionVersion.current += 1;
    activeDeployment.current = undefined;
    setResult(undefined);
    setError(undefined);
    setIsRunning(false);

    if (!runtimeUri || !shouldConnect) {
      setMcpService(undefined);
      return undefined;
    }

    // The test console owns its connection: it is torn down when the drawer closes, so it must
    // not share the instance the spec page keeps alive.
    const service = createMcpService(deployment, authCredentials);
    activeDeployment.current = deployment;
    setMcpService(service);

    return () => {
      connectionVersion.current += 1;
      activeDeployment.current = undefined;
      service?.closeConnection();
      setMcpService((current) => (current === service ? undefined : current));
    };
  }, [authCredentials, deployment, runtimeUri, shouldConnect, transport]);

  useEffect(() => {
    operationVersion.current += 1;
    setResult(undefined);
    setError(undefined);
    setIsRunning(false);
  }, [operation]);

  const run = useCallback(
    async (args: HttpReqParam[]) => {
      if (isRunning) {
        return;
      }

      const version = connectionVersion.current;
      const selectedOperationVersion = operationVersion.current;
      const isCurrentRun = (): boolean =>
        connectionVersion.current === version && operationVersion.current === selectedOperationVersion;
      try {
        setIsRunning(true);

        if (
          !shouldConnect ||
          !mcpService ||
          activeDeployment.current !== deployment ||
          mcpService.serverUri !== runtimeUri ||
          mcpService.declaredTransport !== transport ||
          mcpService.authCredentials !== authCredentials
        ) {
          throw new Error('MCP connection is not ready.');
        }
        if (!operation) {
          throw new Error('MCP operation is unavailable.');
        }

        const name = operation.name.split('/').pop();
        const operationArguments = Object.fromEntries(args.map(({ name, value }) => [name, value]));

        switch (operation.category) {
          case McpCapabilityTypes.TOOLS: {
            const conversion = convertMcpToolArguments((operation.spec as McpTool).inputSchema, args);
            if (conversion.success === false) {
              setResult(undefined);
              setError(conversion.error);
              return;
            }

            const result = await mcpService.runTool(name, conversion.arguments);
            if (isCurrentRun()) setResult(JSON.stringify(result, null, 2));
            break;
          }

          case McpCapabilityTypes.PROMPTS: {
            const result = await mcpService.getPrompt(name, operationArguments);
            if (isCurrentRun()) setResult(JSON.stringify(result, null, 2));
            break;
          }

          case McpCapabilityTypes.RESOURCES: {
            const result = await mcpService.readResource(operationArguments.uri);
            if (isCurrentRun()) setResult(JSON.stringify(result, null, 2));
            break;
          }

          default:
            throw new Error(`Unsupported MCP capability type: ${operation.category}`);
        }

        if (isCurrentRun()) setError(undefined);
      } catch (e) {
        if (!isCurrentRun()) {
          return;
        }
        setResult(undefined);

        if (e instanceof TypeError) {
          setError(
            'Since the browser initiates the request, it requires Cross-Origin Resource Sharing (CORS) enabled on the server.'
          );
        } else {
          setError(e.message || 'Unable to complete request');
        }
      } finally {
        if (isCurrentRun()) setIsRunning(false);
      }
    },
    [authCredentials, deployment, isRunning, mcpService, operation, runtimeUri, shouldConnect, transport]
  );

  return {
    result,
    error,
    isRunning,
    run,
  };
}
