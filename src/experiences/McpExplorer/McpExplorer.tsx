import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from '@fluentui/react-components';
import { ApiOperation, ApiOperationsList } from '@microsoft/api-docs-ui';
import { capitalize } from 'lodash';
import useMcpServer from '@/hooks/useMcpServer';
import { McpCapabilityTypes } from '@/types/mcp';
import styles from './McpExplorer.module.scss';

interface Props {}

export const McpExplorer: React.FC<Props> = () => {
  const [openCategories, setOpenCategories] = useState<string[]>(Object.values(McpCapabilityTypes));
  const [selectedOperationName, setSelectedOperationName] = useState<string>();
  const mcpServer = useMcpServer();
  console.log(mcpServer);

  const operationsByType = useMemo(
    () =>
      Object.values(McpCapabilityTypes).reduce(
        (result, type) => ({
          ...result,
          [type]: mcpServer[type].map((operation) => ({
            name: [type, operation.name].join('/'),
            displayName: operation.name,
            urlTemplate: '/',
          })),
        }),
        {} as Record<McpCapabilityTypes, ApiOperation[]>
      ),
    [mcpServer]
  );

  const operations = useMemo(() => Object.values(operationsByType).flat(), [operationsByType]);
  const selectedOperation = useMemo(
    () => operations.find((operation) => operation.name === selectedOperationName),
    [operations, selectedOperationName]
  );

  useEffect(() => {
    if (!!selectedOperationName || !operations.length) {
      return;
    }

    setSelectedOperationName(operations[0].name);
  }, [operations, operationsByType, selectedOperationName]);

  const handleAccordionToggle = useCallback<React.ComponentProps<typeof Accordion>['onToggle']>((_, data) => {
    setOpenCategories(data.openItems as string[]);
  }, []);

  const handleOperationSelect = useCallback(({ name }) => {
    setSelectedOperationName(name);
  }, []);

  function renderDetails() {
    if (!selectedOperation) {
      return null;
    }

    return (
      <>
        <h1>{selectedOperation.displayName}</h1>
      </>
    );
  }

  return (
    <div className={styles.mcpExplorer}>
      <aside className={styles.operationsList}>
        <Accordion openItems={openCategories} collapsible onToggle={handleAccordionToggle}>
          {Object.entries(operationsByType)
            .filter(([, operations]) => !!operations.length)
            .map(([type, operations]) => (
              <AccordionItem key={type} value={type}>
                <AccordionHeader>{capitalize(type)}</AccordionHeader>
                <AccordionPanel>
                  <ApiOperationsList
                    selectedOperationName={selectedOperationName}
                    operations={operations}
                    onOperationSelect={handleOperationSelect}
                  />
                </AccordionPanel>
              </AccordionItem>
            ))}
        </Accordion>
      </aside>

      <div className={styles.details}>{renderDetails()}</div>
    </div>
  );
};

export default React.memo(McpExplorer);
