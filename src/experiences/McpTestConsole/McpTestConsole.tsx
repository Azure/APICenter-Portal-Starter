import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { capitalize } from 'lodash';
import { Body1Strong, Button, Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { HttpTestConsole, SyntaxHighlighter } from '@microsoft/api-docs-ui';
import { HttpReqParam } from '@microsoft/api-docs-ui/dist/types/testConsole';
import { ApiSpecReader, OperationMetadata, OperationParameterMetadata, StaticProperty } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import useMcpTestRunController from '@/hooks/useMcpTestRunController';
import TestConsoleError from '@/components/TestConsoleError';
import { McpCapabilityTypes } from '@/types/mcp';
import { getUrlTemplateParams, resolveUrlTemplate } from '@/utils/apiOperations';
import styles from './McpTestConsole.module.scss';

interface Props {
  apiSpec: ApiSpecReader;
  operation?: OperationMetadata;
  deployment?: ApiDeployment;
  capabilityType: McpCapabilityTypes;
  isOpen?: boolean;
  onClose: () => void;
}

export const McpTestConsole: React.FC<Props> = ({
  apiSpec,
  operation,
  deployment,
  capabilityType,
  isOpen,
  onClose,
}) => {
  const [toolArgs, setToolArgs] = useState<HttpReqParam[]>();

  const runController = useMcpTestRunController(deployment, operation, isOpen);
  const requestMetadata = apiSpec.getRequestMetadata(operation.name);

  const getResourceUriProperty = useCallback(() => {
    const properties = (requestMetadata?.body?.[0]?.schema?.properties || []) as OperationParameterMetadata[];
    return properties.find((prop) => ['uri', 'uriTemplate'].includes(prop.name)) as unknown as
      | StaticProperty
      | undefined;
  }, [requestMetadata?.body]);

  const argsMetadata = useMemo<OperationParameterMetadata[]>(() => {
    const properties = (requestMetadata?.body?.[0]?.schema?.properties || []) as OperationParameterMetadata[];

    if (capabilityType === McpCapabilityTypes.RESOURCES) {
      const uriProp = getResourceUriProperty();
      const params = getUrlTemplateParams(uriProp?.value || '');

      return params.map((name) => ({
        name,
        type: 'string',
        description: `The resource URI parameter "${name}"`,
        required: true,
      }));
    }

    return properties;
  }, [capabilityType, getResourceUriProperty, requestMetadata?.body]);

  useEffect(() => {
    setToolArgs(argsMetadata.map(({ name }) => ({ name, value: '' })));
  }, [argsMetadata]);

  const handleArgumentsChange = useCallback((_, nextArgs: HttpReqParam[]) => {
    setToolArgs(nextArgs);
  }, []);

  const handleRunClick = useCallback(() => {
    if (capabilityType === McpCapabilityTypes.RESOURCES) {
      const uriProp = getResourceUriProperty();
      void runController.run([{ name: 'uri', value: resolveUrlTemplate(uriProp?.value, toolArgs) }]);
      return;
    }
    void runController.run(toolArgs);
  }, [capabilityType, getResourceUriProperty, runController, toolArgs]);

  function getRunButtonLabel() {
    switch (capabilityType) {
      case McpCapabilityTypes.TOOLS:
        return runController.isRunning ? 'Running tool' : 'Run tool';

      case McpCapabilityTypes.PROMPTS:
        return runController.isRunning ? 'Getting prompt' : 'Get prompt';

      case McpCapabilityTypes.RESOURCES:
        return runController.isRunning ? 'Getting resource' : 'Get resource';

      default:
        return null;
    }
  }

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
          {capitalize(operation?.category)}: {operation?.displayName}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <HttpTestConsole>
          {!!argsMetadata.length && (
            <HttpTestConsole.ParamsListForm
              name="arguments"
              title="Arguments"
              value={toolArgs}
              params={argsMetadata}
              isStrictSchema
              onChange={handleArgumentsChange}
            />
          )}

          {renderResult()}
        </HttpTestConsole>

        <div className={styles.runBtnWrapper}>
          <Button appearance="primary" disabledFocusable={runController.isRunning} onClick={handleRunClick}>
            {getRunButtonLabel()}
          </Button>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default React.memo(McpTestConsole);
