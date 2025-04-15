import React, { useCallback, useState } from 'react';
import { Button } from '@fluentui/react-components';
import ParamSchemaDefinition from '@/components/ParamSchemaDefinition';
import { OperationDetailsViewProps } from '../types';
import { McpCapabilityTypes } from '@/types/mcp';
import McpTestConsole from '@/experiences/McpTestConsole';

export const McpResourceOperationDetails: React.FC<OperationDetailsViewProps> = ({
  operation,
  apiSpec,
  deployment,
}) => {
  const [isTestConsoleOpen, setIsTestConsoleOpen] = useState(false);

  const requestMetadata = apiSpec.getRequestMetadata(operation.name);

  const handleTryApiClick = useCallback(() => {
    setIsTestConsoleOpen(true);
  }, []);

  const handleTestConsoleClose = useCallback(() => {
    setIsTestConsoleOpen(false);
  }, []);

  return (
    <>
      <Button onClick={handleTryApiClick}>Read resource</Button>

      <McpTestConsole
        apiSpec={apiSpec}
        operation={operation}
        deployment={deployment}
        capabilityType={operation.category as McpCapabilityTypes}
        isOpen={isTestConsoleOpen}
        onClose={handleTestConsoleClose}
      />

      <h3>Resource</h3>
      <ParamSchemaDefinition mediaContentList={requestMetadata.body} />
    </>
  );
};

export default React.memo(McpResourceOperationDetails);
