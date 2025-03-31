/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Body1Strong, Button, Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { HttpTestConsole, SyntaxHighlighter } from '@microsoft/api-docs-ui';
import { HttpReqParam } from '@microsoft/api-docs-ui/src/types/testConsole';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import useMcpTestRunController from '@/hooks/useMcpTestRunController';
import TestConsoleError from '@/components/TestConsoleError';
import { ApiAuthCredentials } from '@/types/apiAuth';
import useApiAuthorization from '@/hooks/useApiAuthorization';
import TestConsoleAuth from '@/experiences/HttpTestConsole/TestConsoleAuth';
import styles from './McpTestConsole.module.scss';

interface Props {
  apiName: string;
  versionName: string;
  
  apiSpec?: ApiSpecReader;
  operation?: OperationMetadata;
  deployment?: ApiDeployment;
  isOpen?: boolean;
  onClose: () => void;
}

export const McpTestConsole: React.FC<Props> = ({ 
  apiName,
  versionName,
  apiSpec, 
  operation, 
  deployment, 
  isOpen, 
  onClose 
}) => {
  const [toolArgs, setToolArgs] = useState<HttpReqParam[]>();
  const [authCredentials, setAuthCredentials] = useState<ApiAuthCredentials | undefined>();

  const runController = useMcpTestRunController(deployment, operation);
  const apiAuth = useApiAuthorization({ apiName, versionName });

  const argsMetadata = useMemo(
    () => apiSpec?.getRequestMetadata(operation?.name)?.body?.[0]?.schema?.properties || [],
    [apiSpec, operation?.name]
  );

  useEffect(() => {
    if (argsMetadata?.length > 0) {
      setToolArgs(argsMetadata.map(({ name }) => ({ name, value: '' })));
    } else {
      setToolArgs([]);
    }
  }, [argsMetadata]);

  const handleArgumentsChange = useCallback((_, nextArgs: HttpReqParam[]) => {
    setToolArgs(nextArgs);
  }, []);

  const handleAuthCredentialsChange = useCallback((credentials?: ApiAuthCredentials) => {
    setAuthCredentials(credentials);
  }, []);

  const handleRunClick = useCallback(() => {
    // Include auth credentials if available
    const argsWithAuth = toolArgs ? [...toolArgs] : [];
    
    if (authCredentials) {
      // Add auth credentials to args if needed
      // For MCP, we typically need to add the auth to the tool arguments
      argsWithAuth.push({
        name: 'authToken', // Or another appropriate name based on your MCP auth requirements
        value: authCredentials.value
      });
    }
    
    void runController.run(argsWithAuth);
  }, [runController, toolArgs, authCredentials]);

  function renderResult() {
    if (!runController.result && !runController.error) {
      return null;
    }

    let content: React.ReactNode = <TestConsoleError>{runController.error}</TestConsoleError>;
    if (runController.result) {
      content = <SyntaxHighlighter language="json">{runController.result}</SyntaxHighlighter>;
    }

    return (
      <HttpTestConsole.Panel name="result" header={<Body1Strong>Run result</Body1Strong>} isOpenByDefault>
        {content}
      </HttpTestConsole.Panel>
    );
  }

  // Helper function to map args to API parameters
  const formatArgsToApiParameters = (args) => {
    if (!args || !Array.isArray(args)) return [];
    
    return args.map(arg => ({
      name: arg.name,
      type: arg.schema?.type || 'string',
      in: 'body',
      required: arg.schema?.required || false,
      schema: arg.schema || { type: 'string' },
      description: arg.schema?.description || '',
    }));
  };

  return (
    <Drawer className={styles.mcpTestConsole} size="medium" position="end" open={isOpen} onOpenChange={onClose}>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={onClose} />}
        >
          {operation?.displayName}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <HttpTestConsole>
          {/* Add auth panel similar to HttpTestConsole */}
          {!apiAuth.isLoading && !!apiAuth.schemeOptions?.length && (
            <HttpTestConsole.Panel name="auth" header="Authorization" isOpenByDefault>
              <TestConsoleAuth apiName={apiName} versionName={versionName} onChange={handleAuthCredentialsChange} />
            </HttpTestConsole.Panel>
          )}
          
          <HttpTestConsole.ParamsListForm
            name="arguments"
            title="Arguments"
            value={toolArgs}
            params={formatArgsToApiParameters(argsMetadata)}
            isStrictSchema
            onChange={handleArgumentsChange}
          />

          {renderResult()}
        </HttpTestConsole>

        <div className={styles.runBtnWrapper}>
          <Button appearance="primary" disabledFocusable={runController.isRunning} onClick={handleRunClick}>
            {runController.isRunning ? 'Running tool' : 'Run tool'}
          </Button>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default React.memo(McpTestConsole);