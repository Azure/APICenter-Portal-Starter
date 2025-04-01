import { useCallback, useEffect, useState, useRef } from 'react';
import { HttpReqParam } from '@microsoft/api-docs-ui';
import { OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import McpService from '@/services/McpService';
import { ApiAuthCredentials } from '@/types/apiAuth';

interface ReturnType {
  result?: string;
  error?: string;
  isRunning: boolean;
  run: (args: HttpReqParam[], headers: HttpReqParam[]) => Promise<void>;
  isReady: boolean;
}

export default function useMcpTestRunController(
  deployment?: ApiDeployment,
  operation?: OperationMetadata,
  authCredentials?: ApiAuthCredentials
): ReturnType {
  const mcpServiceRef = useRef<McpService | null>(null);
  const [result, setResult] = useState<string>(undefined);
  const [error, setError] = useState<string>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize the McpService
  useEffect(() => {
    const runtimeUri = deployment?.server?.runtimeUri?.[0];
    if (!runtimeUri || !operation) {
      setIsReady(false);
      return;
    }

    // Clean up old service if it exists
    if (mcpServiceRef.current) {
      console.log('Cleaning up previous McpService instance');
      mcpServiceRef.current.closeConnection();
      mcpServiceRef.current = null;
      setIsReady(false);
    }

    console.log('Creating new McpService instance with URI:', runtimeUri);
    console.log('Auth credentials present:', !!authCredentials?.value);

    // Create new service
    const service = new McpService(runtimeUri, authCredentials);
    mcpServiceRef.current = service;

    // Set up initialization check
    service
      .ensureInitialized()
      .then(() => {
        console.log('McpService successfully initialized');
        setIsReady(true);
      })
      .catch((err) => {
        console.error('McpService initialization failed:', err);
        setError(`Failed to initialize API connection: ${err.message}`);
        setIsReady(false);
      });

    // Clean up on unmount
    return () => {
      console.log('Cleaning up McpService on hook unmount');
      if (mcpServiceRef.current) {
        // mcpServiceRef.current.closeConnection();
        mcpServiceRef.current = null;
      }
    };
  }, [authCredentials, deployment?.server?.runtimeUri, operation]);

  // Reset state when operation changes
  useEffect(() => {
    setResult(undefined);
    setError(undefined);
    setIsRunning(false);
  }, [operation]);

  const run = useCallback(
    async (args: HttpReqParam[], headers: HttpReqParam[]) => {
      if (isRunning || !mcpServiceRef.current || !isReady) {
        console.error('Cannot run: service not ready or already running');
        if (!isReady) setError('API connection not ready. Please wait a moment and try again.');
        return;
      }

      try {
        setIsRunning(true);
        setError(undefined);

        if (!operation?.name) {
          throw new Error('Operation name is missing');
        }

        const toolName = operation.name.split('/').pop();
        const toolArgs = Object.fromEntries(args.map(({ name, value }) => [name, value]));
        const toolHeaders = Object.fromEntries(headers.map(({ name, value }) => [name, value]));

        console.log(`Executing tool: ${toolName}`);
        console.log('Arguments:', toolArgs);
        console.log('Headers:', Object.keys(toolHeaders));

        const result = await mcpServiceRef.current.callTool(toolName, toolArgs, toolHeaders);
        console.log('Tool execution successful');

        setResult(JSON.stringify(result, null, 2));
      } catch (e) {
        console.error('Tool execution failed:', e);

        if (e instanceof TypeError) {
          setError(
            'Since the browser initiates the request, it requires Cross-Origin Resource Sharing (CORS) enabled on the server.'
          );
        } else {
          setError(`Request failed: ${e.message || 'Unknown error'}`);
        }
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, isReady, operation]
  );

  return {
    result,
    error,
    isRunning,
    run,
    isReady,
  };
}
