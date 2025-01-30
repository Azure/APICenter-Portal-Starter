import React, { useCallback, useEffect } from 'react';
import { ApiOperationsList } from '@microsoft/api-docs-ui';
import { useLocation } from 'react-router-dom';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import useSelectedOperation from '@/hooks/useSelectedOperation';

interface Props {
  apiSpec: ApiSpecReader;
}

export const ApiOperationsSelect: React.FC<Props> = ({ apiSpec }) => {
  const location = useLocation();
  const selectedOperation = useSelectedOperation();

  const operations = apiSpec.getOperations();

  const handleOperationSelect = useCallback(
    (operation: OperationMetadata) => {
      selectedOperation.set(operation.name);
    },
    [selectedOperation]
  );

  /**
   * Reset selected operation if it's not found in the current spec.
   * It can happen when spec is replaced with another one.
   */
  useEffect(() => {
    selectedOperation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (selectedOperation.name || !operations.length) {
      return;
    }
    handleOperationSelect(operations[0]);
  }, [handleOperationSelect, operations, selectedOperation]);

  return (
    <ApiOperationsList
      selectedOperationName={selectedOperation.name}
      operations={operations}
      onOperationSelect={handleOperationSelect}
    />
  );
};

export default React.memo(ApiOperationsSelect);
