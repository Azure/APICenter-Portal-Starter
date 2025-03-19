import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Body1Strong, Button, Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { HttpTestConsole, SyntaxHighlighter } from '@microsoft/api-docs-ui';
import { HttpReqParam } from '@microsoft/api-docs-ui/src/types/testConsole';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import useMcpTestRunController from '@/hooks/useMcpTestRunController';
import TestConsoleError from '@/components/TestConsoleError';
import styles from './McpTestConsole.module.scss';

interface Props {
  apiSpec: ApiSpecReader;
  operation?: OperationMetadata;
  deployment?: ApiDeployment;
  isOpen?: boolean;
  onClose: () => void;
}

export const McpTestConsole: React.FC<Props> = ({ apiSpec, operation, deployment, isOpen, onClose }) => {
  const [toolArgs, setToolArgs] = useState<HttpReqParam[]>();

  const runController = useMcpTestRunController(deployment, operation);

  const argsMetadata = useMemo(
    () => apiSpec.getRequestMetadata(operation.name)?.body?.[0]?.schema?.properties || [],
    [apiSpec, operation.name]
  );

  useEffect(() => {
    setToolArgs(argsMetadata.map(({ name }) => ({ name, value: '' })));
  }, [argsMetadata]);

  const handleArgumentsChange = useCallback((_, nextArgs: HttpReqParam[]) => {
    setToolArgs(nextArgs);
  }, []);

  const handleRunClick = useCallback(() => {
    void runController.run(toolArgs);
  }, [runController, toolArgs]);

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
            name="arguments"
            title="Arguments"
            value={toolArgs}
            params={argsMetadata}
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
