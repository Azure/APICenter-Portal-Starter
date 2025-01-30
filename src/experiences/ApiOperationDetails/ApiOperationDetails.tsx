import React from 'react';
import { ApiOperationInfo, ParametersTable } from '@microsoft/api-docs-ui';
import { Link } from '@fluentui/react-components';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import { getRefLabel } from '@/utils/openApi';
import styles from './ApiOperationDetails.module.scss';

interface Props {
  apiSpec: ApiSpecReader;
  operation?: OperationMetadata;
}

export const ApiOperationDetails: React.FC<Props> = ({ apiSpec, operation }) => {
  if (!operation) {
    return null;
  }

  function renderRefLink(ref: string) {
    const refLabel = getRefLabel(ref);
    return <Link href={`#${refLabel}`}>{refLabel}</Link>;
  }

  function renderRequestInfo() {
    const requestMetadata = apiSpec.getRequestMetadata(operation.name);

    const blocks: React.ReactNode[] = [];

    if (requestMetadata.description) {
      blocks.push(<p key="description">{requestMetadata.description}</p>);
    }

    if (requestMetadata.parameters.length) {
      blocks.push(
        <React.Fragment key="parameters">
          <h4>Request parameters</h4>
          <ParametersTable parameters={requestMetadata.parameters} />
        </React.Fragment>
      );
    }

    if (requestMetadata.headers.length) {
      blocks.push(
        <React.Fragment key="headers">
          <h4>Request headers</h4>
          <ParametersTable parameters={requestMetadata.headers} />
        </React.Fragment>
      );
    }

    if (requestMetadata.body.length) {
      blocks.push(
        <React.Fragment key="body">
          <h4>
            Request body
            {requestMetadata.bodyRef && <> ({renderRefLink(requestMetadata.bodyRef)})</>}:
          </h4>
          <ParametersTable parameters={requestMetadata.body} hiddenColumns={['readOnly', 'in']} />
        </React.Fragment>
      );
    }

    if (!blocks.length) {
      return <p>No requests data</p>;
    }

    return blocks;
  }

  function renderResponses() {
    const responsesMetadata = apiSpec.getResponsesMetadata(operation.name);
    if (!responsesMetadata.length) {
      return <p>No responses data</p>;
    }

    return responsesMetadata.map((response) => (
      <React.Fragment key={response.code}>
        <h3>Response: {response.code}</h3>
        <p>{response.description}</p>
        {!!response.headers.length && (
          <>
            <h4>Headers:</h4>
            <ParametersTable parameters={response.headers} hiddenColumns={['in', 'readOnly', 'required']} />
          </>
        )}

        {!!response.body.length && (
          <>
            <h4>
              Body
              {response.bodyRef && <> ({renderRefLink(response.bodyRef)})</>}:
            </h4>
            <ParametersTable parameters={response.body} hiddenColumns={['in', 'readOnly', 'required']} />
          </>
        )}
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
          <React.Fragment key={definition.ref}>
            <h4 id={getRefLabel(definition.ref)}>{getRefLabel(definition.ref)}</h4>
            <ParametersTable parameters={definition.parameters} hiddenColumns={['in']} />
          </React.Fragment>
        ))}
      </>
    );
  }

  return (
    <div className={styles.apiOperationDetails}>
      <ApiOperationInfo operation={operation} requestUrl={operation.invocationUrl} tags={apiSpec.getTagLabels()} />

      <h3>Request</h3>
      {renderRequestInfo()}
      {renderResponses()}
      {renderDefinitions()}
    </div>
  );
};

export default React.memo(ApiOperationDetails);
