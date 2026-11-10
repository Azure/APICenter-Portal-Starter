import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ApiOperationsList } from 'api-docs-ui';
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Input } from '@fluentui/react-components';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import { useSelectedOperation } from '@/hooks/useSelectedOperation';
import { sortOperationsAlphabetically } from './utils';
import styles from './ApiOperationsSelect.module.scss';

interface Props {
  apiSpec: ApiSpecReader;
}

export const ApiOperationsSelect: React.FC<Props> = ({ apiSpec }) => {
  const [openCategory, setOpenCategory] = useState<string | undefined>();
  const [operationSearch, setOperationSearch] = useState('');
  const location = useLocation();
  const selectedOperation = useSelectedOperation();

  const operationCategories = apiSpec.getOperationCategories();
  const operations = sortOperationsAlphabetically(apiSpec.getOperations());

  const normalizedSearch = operationSearch.trim().toLowerCase();
  const filteredCategories = operationCategories
    .map((category) => {
      const filteredOperations = sortOperationsAlphabetically(category.operations).filter((operation) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          operation.displayName?.toLowerCase().includes(normalizedSearch) ||
          operation.name?.toLowerCase().includes(normalizedSearch)
        );
      });

      return {
        ...category,
        operations: filteredOperations,
      };
    })
    .filter((category) => category.operations.length > 0);

  const handleOperationSelectByName = useCallback(
    (operationName: string, fallbackCategory?: string) => {
      const operation = apiSpec.getOperation(operationName);
      setOpenCategory(operation?.category ?? fallbackCategory);
      selectedOperation.set(operationName);
    },
    [apiSpec, selectedOperation]
  );

  const handleOperationSelect = useCallback(
    (operation: OperationMetadata) => {
      handleOperationSelectByName(operation.name, operation.category);
    },
    [handleOperationSelectByName]
  );

  useEffect(() => {
    if (!selectedOperation.name) {
      setOpenCategory(filteredCategories[0]?.name);
      return;
    }

    const selectedCategory = apiSpec.getOperation(selectedOperation.name)?.category;
    const categoryVisible = filteredCategories.some((category) => category.name === selectedCategory);
    setOpenCategory(categoryVisible ? selectedCategory : filteredCategories[0]?.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedSearch]);

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
    if (!filteredCategories.length) {
      return;
    }

    if (selectedOperation.name) {
      const selectedVisible = filteredCategories.some((category) =>
        category.operations.some((operation) => operation.name === selectedOperation.name)
      );
      if (selectedVisible) {
        return;
      }
    }

    if (!operations.length) {
      return;
    }

    handleOperationSelect(filteredCategories[0].operations[0]);
  }, [filteredCategories, handleOperationSelect, operations.length, selectedOperation]);

  const handleAccordionToggle = useCallback<NonNullable<React.ComponentProps<typeof Accordion>['onToggle']>>(
    (_, data) => {
      const openItem = data.openItems[0];
      if (data.openItems.length === 0) {
        setOpenCategory(undefined);
        return;
      }

      if (typeof openItem !== 'string' && typeof openItem !== 'number') {
        return;
      }

      const name = String(openItem);
      setOpenCategory(name);
      const category = filteredCategories.find((category) => category.name === name);
      if (category?.operations.length) {
        selectedOperation.set(category.operations[0].name);
      }
    },
    [filteredCategories, selectedOperation]
  );

  return (
    <div className={styles.operationsSelect}>
      <Input
        className={styles.searchInput}
        placeholder="Search operations"
        value={operationSearch}
        onChange={(_, data) => setOperationSearch(data.value)}
      />

      {!filteredCategories.length ? (
        <div className={styles.emptyState}>No operations match this search.</div>
      ) : (
        <Accordion openItems={[openCategory]} collapsible onToggle={handleAccordionToggle}>
          {filteredCategories.map((category) => (
            <AccordionItem key={category.name} value={category.name}>
              <AccordionHeader as="h4" size="large" className="test-class">
                <strong>
                  {category.label} ({category.operations.length})
                </strong>
              </AccordionHeader>
              <AccordionPanel>
                <ApiOperationsList
                  selectedOperationName={selectedOperation.name}
                  operations={category.operations}
                  onOperationSelect={(operation) => handleOperationSelectByName(operation.name)}
                />
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default React.memo(ApiOperationsSelect);
