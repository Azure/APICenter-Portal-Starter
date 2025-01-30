import React, { useCallback, useEffect } from 'react';
import { ApiOperationsList } from '@microsoft/api-docs-ui';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import useSelectedOperation from '@/hooks/useSelectedOperation';

interface Props {
  apiSpec: ApiSpecReader;
}

export const ApiOperationsSelect: React.FC<Props> = ({ apiSpec }) => {
  const selectedOperation = useSelectedOperation();

  const operations = apiSpec.getOperations();

  const handleOperationSelect = useCallback(
    (operation: OperationMetadata) => {
      selectedOperation.set(operation.name);
    },
    [selectedOperation]
  );

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
