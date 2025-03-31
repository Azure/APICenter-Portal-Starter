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
import styles from './McpTestConsole.module.scss';

interface Props {
  apiSpec?: ApiSpecReader;
  operation?: OperationMetadata;
  deployment?: ApiDeployment;
  authCredentials?: ApiAuthCredentials;
  isOpen?: boolean;
  onClose: () => void;
}

export const McpTestConsole: React.FC<Props> = ({ 
  apiSpec, 
  operation, 
  deployment,
  authCredentials, 
  isOpen, 
  onClose 
}) => {
  const [toolArgs, setToolArgs] = useState<HttpReqParam[]>();

  const runController = useMcpTestRunController(deployment, operation);

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

  const handleFormParamsListChange = useCallback((_, nextParams: HttpReqParam[]) => {
    // Here we would typically update headers state, but for MCP we're just using them directly
    console.log('Headers updated:', nextParams);
  }, []);

  const headerParams = useMemo(() => {
    const params = [];

    if (authCredentials) {
      params.push({
        name: authCredentials.name,
        required: true,
        isSecret: true,
        readonly: true,
        schema: {
          type: 'string',
        },
      });
    }
    
    return params;
  }, [authCredentials]);

  const headers = useMemo(() => {
    const headers = [];
    
    if (authCredentials) {
      headers.push({
        name: authCredentials.name,
        value: authCredentials.value
      });
    }
    
    return headers;
  }, [authCredentials]);

  const handleRunClick = useCallback(() => {
    void runController.run(toolArgs, headers);
  }, [runController, toolArgs, headers]);

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
          <HttpTestConsole.ParamsListForm
            name="headers"
            title="Headers"
            addBtnLabel="Add header"
            value={headers}
            params={headerParams}
            isStrictSchema={true}
            onChange={handleFormParamsListChange}
          />
          
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