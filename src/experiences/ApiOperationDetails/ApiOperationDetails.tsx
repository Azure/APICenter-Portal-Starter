import React, { useCallback, useState } from 'react';
import { ApiOperationMethod, InfoPanel, ParametersTable, CopyToClipboard } from '@microsoft/api-docs-ui';
import { Button } from '@fluentui/react-components';
import { ApiSpecReader, ApiSpecTypes, OperationMetadata } from '@/types/apiSpec';
import ParamSchemaDefinition from '@/components/ParamSchemaDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import { resolveOpUrlTemplate } from '@/utils/apiOperations';
import HttpTestConsole from '@/experiences/HttpTestConsole';
import styles from './ApiOperationDetails.module.scss';

interface Props {
  apiName: string;
  versionName: string;
  apiSpec: ApiSpecReader;
  operation?: OperationMetadata;
  deployment?: ApiDeployment;
}

const SPEC_TYPES_WITH_CONSOLE = [ApiSpecTypes.OpenApiV2, ApiSpecTypes.OpenApiV3];

export const ApiOperationDetails: React.FC<Props> = ({ apiName, versionName, apiSpec, operation, deployment }) => {
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

  const isTestConsoleAvailable = SPEC_TYPES_WITH_CONSOLE.includes(apiSpec.type);
  const urlTemplate = resolveOpUrlTemplate(apiSpec, operation, deployment);

  function renderRequestInfo() {
    const requestMetadata = apiSpec.getRequestMetadata(operation.name);

    if (
      !requestMetadata.description &&
      !requestMetadata.parameters?.length &&
      !requestMetadata.headers?.length &&
      !requestMetadata.body
    ) {
      return <p>No requests data</p>;
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

        <ParamSchemaDefinition
          title={apiSpec.type === ApiSpecTypes.GraphQL ? 'Arguments' : 'Request body'}
          mediaContentList={requestMetadata.body}
          hiddenColumns={['in', 'readOnly']}
        />
      </>
    );
  }

  function renderResponses() {
    const responsesMetadata = apiSpec.getResponsesMetadata(operation.name);
    if (!responsesMetadata.length) {
      return <p>No responses data</p>;
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

        <ParamSchemaDefinition title="Body" mediaContentList={response.body} hiddenColumns={['in', 'readOnly']} />
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
            key={definition.$ref}
            title="Body"
            schema={definition}
            hiddenColumns={!definition.isEnum ? ['in', 'readOnly'] : ['in', 'type', 'readOnly', 'required']}
            isEnum={definition.isEnum}
            isGlobalDefinition
          />
        ))}
      </>
    );
  }

  return (
    <div className={styles.apiOperationDetails}>
      <h1>{operation.displayName}</h1>

      {!!operation.description && <p className={styles.description}>{operation.description}</p>}

      <InfoPanel className={styles.infoPanel} title="Endpoint">
        <div className={styles.infoPanelContent}>
          <span className={styles.url}>
            <ApiOperationMethod method={operation.method} /> {urlTemplate}
          </span>

          <CopyToClipboard content={urlTemplate} />
        </div>
      </InfoPanel>

      {isTestConsoleAvailable && (
        <>
          <Button onClick={handleTryApiClick}>Try this API</Button>
          <HttpTestConsole
            apiName={apiName}
            versionName={versionName}
            apiSpec={apiSpec}
            operation={operation}
            deployment={deployment}
            isOpen={isTestConsoleOpen}
            onClose={handleTestConsoleClose}
          />
        </>
      )}

      <h3>Request</h3>
      {renderRequestInfo()}
      {renderResponses()}
      {renderDefinitions()}
    </div>
  );
};

export default React.memo(ApiOperationDetails);
