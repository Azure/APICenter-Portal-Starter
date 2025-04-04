import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ApiOperationsList } from '@microsoft/api-docs-ui';
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from '@fluentui/react-components';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import useSelectedOperation from '@/hooks/useSelectedOperation';
import { sortOperationsAlphabetically } from './utils';

interface Props {
  apiSpec: ApiSpecReader;
}

export const ApiOperationsSelect: React.FC<Props> = ({ apiSpec }) => {
  const [openCategory, setOpenCategory] = useState<string | undefined>();
  const location = useLocation();
  const selectedOperation = useSelectedOperation();

  const operationCategories = apiSpec.getOperationCategories();
  const operations = sortOperationsAlphabetically(apiSpec.getOperations());

  const handleOperationSelect = useCallback(
    (operation: OperationMetadata) => {
      setOpenCategory(operation.category);
      selectedOperation.set(operation.name);
    },
    [selectedOperation]
  );

  useEffect(() => {
    if (!selectedOperation.name) {
      setOpenCategory(operationCategories[0]?.name);
      return;
    }

    setOpenCategory(apiSpec.getOperation(selectedOperation.name)?.category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Reset selected operation if it's not found in the current spec.
   * It can happen when spec is replaced with another one.
   */
  useEffect(() => {
    if (!selectedOperation.name || apiSpec.getOperation(selectedOperation.name)) {
      return;
    }
    selectedOperation.reset();
  }, [apiSpec, location.pathname, selectedOperation]);

  useEffect(() => {
    if (selectedOperation.name || !operations.length) {
      return;
    }
    handleOperationSelect(operationCategories[0].operations[0]);
  }, [handleOperationSelect, operationCategories, operations, selectedOperation]);

  const handleAccordionToggle = useCallback<React.ComponentProps<typeof Accordion>['onToggle']>(
    (_, data) => {
      const name = String(data.openItems[0]);
      setOpenCategory(name);
      const category = operationCategories.find((category) => category.name === name);
      if (category?.operations.length) {
        selectedOperation.set(category.operations[0].name);
      }
    },
    [operationCategories, selectedOperation]
  );

  return (
    <Accordion openItems={[openCategory]} collapsible onToggle={handleAccordionToggle}>
      {operationCategories.map((category) => (
        <AccordionItem key={category.name} value={category.name}>
          <AccordionHeader as="h4" size="large" className="test-class">
            <strong>
              {category.label} ({category.operations.length})
            </strong>
          </AccordionHeader>
          <AccordionPanel>
            <ApiOperationsList
              selectedOperationName={selectedOperation.name}
              operations={sortOperationsAlphabetically(category.operations)}
              onOperationSelect={handleOperationSelect}
            />
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default React.memo(ApiOperationsSelect);
