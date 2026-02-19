import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiOperationMethod,
  HttpBodyFormats,
  HttpReqBodyData,
  HttpReqData,
  HttpReqParam,
  HttpTestConsole as HttpApiTestConsole,
  SyntaxHighlighter,
} from 'api-docs-ui';
import { Body1Strong, Button, Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { uniqBy } from 'lodash';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import { useHttpTestRequestController } from '@/hooks/useHttpTestRequestController';
import { ApiAuthCredentials } from '@/types/apiAuth';
import TestConsoleError from '@/components/TestConsoleError';
import { ApiDefinitionId } from '@/types/apiDefinition';
import ApiAccessAuthForm from '@/experiences/ApiAccessAuthForm';
import { useApiAuthSchemes } from '@/hooks/useApiAuthSchemes';
import { useApiVersions } from '@/hooks/useApiVersions';
import {
  getFormDataFieldsMetadata,
  getReqBodySupportedFormats,
  getReqDataDefaults,
  getSchemaParamsByLocation,
  inToParamsCollectionName,
  stringifyResponse,
} from './utils';
import styles from './HttpTestConsole.module.scss';

interface Props {
  definitionId: ApiDefinitionId;
  apiSpec: ApiSpecReader;
  operation?: OperationMetadata;
  deployment?: ApiDeployment;
  isOpen?: boolean;
  onClose: () => void;
}

const methodsWithoutBody = ['get', 'head'];

export const HttpTestConsole: React.FC<Props> = ({ definitionId, apiSpec, operation, deployment, isOpen, onClose }) => {
  const apiVersions = useApiVersions(definitionId.apiName);
  const selectedVersion = apiVersions.data?.find((v) => v.name === definitionId.versionName);
  const versionTitle = selectedVersion?.title === 'Original' ? '' : (selectedVersion?.title || definitionId.versionName);
  const defaults = getReqDataDefaults(apiSpec, operation, deployment, versionTitle);
  const [authCredentials, setAuthCredentials] = useState<ApiAuthCredentials | undefined>();
  const [reqData, setReqData] = useState<HttpReqData>(defaults);

  const apiAuthSchemes = useApiAuthSchemes(definitionId);

  const requestController = useHttpTestRequestController(operation);

  useEffect(() => {
    setReqData(defaults);
  }, [defaults]);

  const reqDataWithAuth = useMemo(() => {
    if (!authCredentials) {
      return reqData;
    }

    const collection = inToParamsCollectionName(authCredentials.in);

    return {
      ...reqData,
      [collection]: [
        {
          name: authCredentials.name,
          value: authCredentials.value,
        } as HttpReqParam,
      ].concat(reqData[collection] || []),
    };
  }, [authCredentials, reqData]);

  const schemaParamsData = useMemo(() => {
    const result = getSchemaParamsByLocation(apiSpec, operation);
    if (!authCredentials) {
      return result;
    }

    const collection = inToParamsCollectionName(authCredentials.in);

    return {
      ...result,
      [collection]: uniqBy(
        [
          {
            name: authCredentials.name,
            required: true,
            isSecret: true,
            readOnly: true,
            schema: {
              type: 'string',
            },
          },
        ].concat(result[collection] || []),
        'name'
      ),
    };
  }, [apiSpec, authCredentials, operation]);

  const supportedBodyFormats = getReqBodySupportedFormats(apiSpec, operation);
  const canHaveBody = !methodsWithoutBody.includes(operation?.method);

  const rawBodyDataSamples = useMemo(() => {
    const requestMetadata = apiSpec.getRequestMetadata(operation.name);

    return requestMetadata.body
      .filter(({ sampleData }) => !!sampleData)
      .map(({ type, sampleData }) => ({
        name: type,
        value: sampleData.data,
      }));
  }, [apiSpec, operation]);

  const handleFormParamsListChange = useCallback(
    (name: keyof Omit<HttpReqData, 'body'>, value: HttpReqParam[]) => {
      let resolvedValue = value;

      // Remove synthetic auth param on change to avoid duplication
      if (authCredentials && inToParamsCollectionName(authCredentials.in) === name) {
        // Based on assumption that auth param is always first
        resolvedValue = value.slice(1);
      }
      setReqData((prev) => ({ ...prev, [name]: resolvedValue }));
    },
    [authCredentials]
  );

  const handleBodyChange = useCallback((value: HttpReqBodyData) => {
    setReqData((prev) => ({ ...prev, body: value }));
  }, []);

  const handleAuthCredentialsChange = useCallback((credentials?: ApiAuthCredentials) => {
    setAuthCredentials(credentials);
    if (!credentials) {
      return;
    }

    // If param with the same name already exists - remove it to avoid duplication
    const collection = inToParamsCollectionName(credentials.in);
    setReqData((prev) => ({
      ...prev,
      [collection]: prev[collection]?.filter((param) => param.name !== credentials.name),
    }));
  }, []);

  const handleSendClick = useCallback(() => {
    void requestController.mutate(HttpApiTestConsole.resolveHttpReqData(reqDataWithAuth, schemaParamsData, true));
  }, [reqDataWithAuth, requestController, schemaParamsData]);

  function renderResponse() {
    if (!requestController.data && !requestController.error) {
      return null;
    }

    let content: React.ReactNode = <TestConsoleError>{requestController.error?.message}</TestConsoleError>;
    if (requestController.data) {
      content = <SyntaxHighlighter language="http">{stringifyResponse(requestController.data)}</SyntaxHighlighter>;
    }

    return (
      <HttpApiTestConsole.Panel name="response" header={<Body1Strong>HTTP response</Body1Strong>} isOpenByDefault>
        {content}
      </HttpApiTestConsole.Panel>
    );
  }

  return (
    <Drawer className={styles.httpTestConsole} size="medium" position="end" open={isOpen} onOpenChange={onClose}>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={onClose} />}
        >
          <ApiOperationMethod method={operation.method} /> {operation.urlTemplate}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <HttpApiTestConsole>
          {!apiAuthSchemes.isLoading && !!apiAuthSchemes.data?.length && (
            <HttpApiTestConsole.Panel name="auth" header="Authorization" isOpenByDefault>
              <ApiAccessAuthForm definitionId={definitionId} onChange={handleAuthCredentialsChange} />
            </HttpApiTestConsole.Panel>
          )}
          <HttpApiTestConsole.ParamsListForm
            name="urlParams"
            title="URL parameters"
            addBtnLabel="Add parameter"
            params={schemaParamsData.urlParams}
            value={reqDataWithAuth.urlParams}
            isStrictSchema
            onChange={handleFormParamsListChange}
          />

          <HttpApiTestConsole.ParamsListForm
            name="query"
            title="Query"
            addBtnLabel="Add parameter"
            value={reqDataWithAuth.query}
            params={schemaParamsData.query}
            onChange={handleFormParamsListChange}
          />

          <HttpApiTestConsole.ParamsListForm
            name="headers"
            title="Headers"
            addBtnLabel="Add header"
            value={reqDataWithAuth.headers}
            params={schemaParamsData.headers}
            onChange={handleFormParamsListChange}
          />

          {canHaveBody && (
            <HttpApiTestConsole.BodyForm name="body" value={reqDataWithAuth.body} onChange={handleBodyChange}>
              {supportedBodyFormats.includes(HttpBodyFormats.Raw) && (
                <HttpApiTestConsole.BodyForm.Raw dataSamples={rawBodyDataSamples} />
              )}
              {supportedBodyFormats.includes(HttpBodyFormats.Binary) && <HttpApiTestConsole.BodyForm.Binary />}
              {supportedBodyFormats.includes(HttpBodyFormats.FormData) && (
                <HttpApiTestConsole.BodyForm.FormData fields={getFormDataFieldsMetadata(apiSpec, operation)} />
              )}
            </HttpApiTestConsole.BodyForm>
          )}

          <HttpApiTestConsole.RequestPreview
            name="request"
            title="HTTP request"
            reqData={reqDataWithAuth}
            schemas={schemaParamsData}
          />

          {renderResponse()}
        </HttpApiTestConsole>

        <div className={styles.sendBtnWrapper}>
          <Button appearance="primary" disabledFocusable={requestController.isPending} onClick={handleSendClick}>
            {requestController.isPending ? 'Sending' : 'Send'}
          </Button>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default React.memo(HttpTestConsole);
