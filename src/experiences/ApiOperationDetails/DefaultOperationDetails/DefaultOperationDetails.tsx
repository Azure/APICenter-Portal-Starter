import React, { useCallback, useState } from 'react';
import { ParametersTable } from '@microsoft/api-docs-ui';
import { Button } from '@fluentui/react-components';
import { ApiSpecReader, ApiSpecTypes } from '@/types/apiSpec';
import ParamSchemaDefinition from '@/components/ParamSchemaDefinition';
import HttpTestConsole from '@/experiences/HttpTestConsole';
import McpTestConsole from '@/experiences/McpTestConsole';
import { McpCapabilityTypes } from '@/types/mcp';
import { OperationDetailsViewProps } from '../types';

function getRequestBodyTitle(apiSpec: ApiSpecReader): string {
  if ([ApiSpecTypes.GraphQL, ApiSpecTypes.MCP].includes(apiSpec.type)) {
    return 'Arguments';
  }

  return 'Request body';
}

export const DefaultOperationDetails: React.FC<OperationDetailsViewProps> = ({
  definitionId,
  apiSpec,
  operation,
  deployment,
}) => {
  const [isTestConsoleOpen, setIsTestConsoleOpen] = useState(false);

  const handleTryApiClick = useCallback(() => {
    setIsTestConsoleOpen(true);
  }, []);

  const handleTestConsoleClose = useCallback(() => {
    setIsTestConsoleOpen(false);
  }, []);

  if (!operation) {
    return null;
  }

  function renderTestConsole() {
    if ([ApiSpecTypes.OpenApiV2, ApiSpecTypes.OpenApiV3].includes(apiSpec.type)) {
      return (
        <>
          <Button onClick={handleTryApiClick}>Try this API</Button>
          <HttpTestConsole
            definitionId={definitionId}
            apiSpec={apiSpec}
            operation={operation}
            deployment={deployment}
            isOpen={isTestConsoleOpen}
            onClose={handleTestConsoleClose}
          />
        </>
      );
    }

    if (apiSpec.type === ApiSpecTypes.MCP) {
      if (![McpCapabilityTypes.TOOLS, McpCapabilityTypes.PROMPTS].includes(operation.category as McpCapabilityTypes)) {
        return null;
      }

      return (
        <>
          <Button onClick={handleTryApiClick}>
            {operation.category === McpCapabilityTypes.TOOLS ? 'Run tool' : 'Get prompt'}
          </Button>

          <McpTestConsole
            apiSpec={apiSpec}
            operation={operation}
            deployment={deployment}
            capabilityType={operation.category as McpCapabilityTypes}
            isOpen={isTestConsoleOpen}
            onClose={handleTestConsoleClose}
          />
        </>
      );
    }

    return null;
  }

  function renderRequestInfo() {
    const requestMetadata = apiSpec.getRequestMetadata(operation.name);

    if (
      !requestMetadata.description &&
      !requestMetadata.parameters?.length &&
      !requestMetadata.headers?.length &&
      !requestMetadata.body
    ) {
      return null;
    }

    return (
      <>
        {!!requestMetadata.description && <p>{requestMetadata.description}</p>}
        {!!requestMetadata.parameters?.length && (
          <>
            <h4>Request parameters</h4>
            <ParametersTable parameters={requestMetadata.parameters} hiddenColumns={['readOnly']} />
          </>
        )}
        {!!requestMetadata.headers?.length && (
          <>
            <h4>Request headers</h4>
            <ParametersTable parameters={requestMetadata.headers} hiddenColumns={['in', 'readOnly']} />
          </>
        )}

        <ParamSchemaDefinition title={getRequestBodyTitle(apiSpec)} mediaContentList={requestMetadata.body} />
      </>
    );
  }

  function renderResponses() {
    const responsesMetadata = apiSpec.getResponsesMetadata(operation.name);
    if (!responsesMetadata.length) {
      return null;
    }

    return responsesMetadata.map((response, i) => (
      <React.Fragment key={i}>
        <h3>Response: {response.code}</h3>
        <p>{response.description}</p>
        {!!response.headers?.length && (
          <>
            <h4>Headers:</h4>
            <ParametersTable parameters={response.headers} hiddenColumns={['in', 'readOnly', 'required']} />
          </>
        )}

        <ParamSchemaDefinition title="Body" mediaContentList={response.body} />
      </React.Fragment>
    ));
  }

  function renderDefinitions() {
    const definitions = apiSpec.getOperationDefinitions(operation.name);
    if (!definitions.length) {
      return null;
    }

    return (
      <>
        <h3>Definitions</h3>
        {definitions.map((definition) => (
          <ParamSchemaDefinition
            key={definition.$ref || definition.refLabel}
            title="Body"
            schema={definition}
            isGlobalDefinition
          />
        ))}
      </>
    );
  }

  return (
    <>
      {renderTestConsole()}

      <h3>Request</h3>
      {renderRequestInfo()}
      {renderResponses()}
      {renderDefinitions()}
    </>
  );
};

export default React.memo(DefaultOperationDetails);
