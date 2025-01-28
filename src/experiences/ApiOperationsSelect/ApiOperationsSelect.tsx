import React, { useCallback, useEffect, useMemo } from 'react';
import { OpenAPI } from 'openapi-types';
import { ApiOperationsList } from '@microsoft/api-docs-ui';
import { useSearchParams } from 'react-router-dom';
import { OperationMetadata } from '@/types/apiSpec';
import OpenApiParser from '@/parsers/openApiParser';
import useSelectedOperation from '@/hooks/useSelectedOperation';

interface Props {
  apiSpec: OpenAPI.Document;
}

export const ApiOperationsSelect: React.FC<Props> = ({ apiSpec }) => {
  const selectedOperation = useSelectedOperation();

  const operations = useMemo(() => {
    if (!apiSpec) {
      return [];
    }

    return OpenApiParser.getOperations(apiSpec);
  }, [apiSpec]);

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
