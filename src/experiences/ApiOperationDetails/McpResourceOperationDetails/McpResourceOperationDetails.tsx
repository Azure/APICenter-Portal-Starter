import React from 'react';
import ParamSchemaDefinition from '@/components/ParamSchemaDefinition';
import { OperationDetailsViewProps } from '../types';

export const McpResourceOperationDetails: React.FC<OperationDetailsViewProps> = ({ operation, apiSpec }) => {
  const requestMetadata = apiSpec.getRequestMetadata(operation.name);

  return (
    <>
      <h3>Resource</h3>
      <ParamSchemaDefinition mediaContentList={requestMetadata.body} />
    </>
  );
};

export default React.memo(McpResourceOperationDetails);
