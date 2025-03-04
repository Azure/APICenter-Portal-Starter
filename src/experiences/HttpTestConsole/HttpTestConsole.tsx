import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiOperationMethod,
  HttpBodyFormats,
  HttpReqBodyData,
  HttpReqData,
  HttpReqParam,
  HttpTestConsole as HttpApiTestConsole,
  SyntaxHighlighter,
} from '@microsoft/api-docs-ui';
import { Button, Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import useHttpTestRequestController from '@/hooks/useHttpTestRequestController';
import {
  getFormDataFieldsMetadata,
  getReqBodySupportedFormats,
  getReqDataDefaults,
  getSchemaParamsByLocation,
  stringifyResponse,
} from './utils';
import styles from './HttpTestConsole.module.scss';

interface Props {
  apiSpec: ApiSpecReader;
  operation?: OperationMetadata;
  deployment?: ApiDeployment;
  isOpen?: boolean;
  onClose: () => void;
}

const methodsWithoutBody = ['get', 'head'];

export const HttpTestConsole: React.FC<Props> = ({ apiSpec, operation, deployment, isOpen, onClose }) => {
  const defaults = getReqDataDefaults(apiSpec, operation, deployment);
  const [reqData, setReqData] = useState<HttpReqData>(defaults);

  const requestController = useHttpTestRequestController();

  useEffect(() => {
    setReqData(defaults);
  }, [defaults]);

  const supportedBodyFormats = getReqBodySupportedFormats(apiSpec, operation);
  const schemaParamsData = getSchemaParamsByLocation(apiSpec, operation);
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

  const handleFormParamsListChange = useCallback((name: keyof Omit<HttpReqData, 'body'>, value: HttpReqParam[]) => {
    setReqData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleBodyChange = useCallback((value: HttpReqBodyData) => {
    setReqData((prev) => ({ ...prev, body: value }));
  }, []);

  const handleSendClick = useCallback(() => {
    void requestController.send(HttpApiTestConsole.resolveHttpReqData(reqData, schemaParamsData));
  }, [reqData, requestController, schemaParamsData]);

  function renderResponse() {
    if (!requestController.response && !requestController.error) {
      return null;
    }

    let content: React.ReactNode = <div className={styles.responseError}>{requestController.error}</div>;
    if (requestController.response) {
      content = <SyntaxHighlighter language="http">{stringifyResponse(requestController.response)}</SyntaxHighlighter>;
    }

    return (
      <HttpApiTestConsole.Panel name="response" header="HTTP response" isOpenByDefault>
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
          <HttpApiTestConsole.ParamsListForm
            name="urlParams"
            title="URL parameters"
            params={schemaParamsData.urlParams}
            value={reqData.urlParams}
            isStrictSchema
            onChange={handleFormParamsListChange}
          />

          <HttpApiTestConsole.ParamsListForm
            name="query"
            title="Query"
            value={reqData.query}
            params={schemaParamsData.query}
            onChange={handleFormParamsListChange}
          />

          <HttpApiTestConsole.ParamsListForm
            name="headers"
            title="Headers"
            value={reqData.headers}
            params={schemaParamsData.headers}
            onChange={handleFormParamsListChange}
          />

          {canHaveBody && (
            <HttpApiTestConsole.BodyForm name="body" value={reqData.body} onChange={handleBodyChange}>
              {supportedBodyFormats.includes(HttpBodyFormats.Raw) && (
                <HttpApiTestConsole.BodyForm.Raw dataSamples={rawBodyDataSamples} />
              )}
              {supportedBodyFormats.includes(HttpBodyFormats.Binary) && <HttpApiTestConsole.BodyForm.Binary />}
              {supportedBodyFormats.includes(HttpBodyFormats.FormData) && (
                <HttpApiTestConsole.BodyForm.FormData fields={getFormDataFieldsMetadata(apiSpec, operation)} />
              )}
            </HttpApiTestConsole.BodyForm>
          )}

          <HttpApiTestConsole.RequestPreview name="request" reqData={reqData} schemas={schemaParamsData} />

          {renderResponse()}
        </HttpApiTestConsole>

        <div className={styles.sendBtnWrapper}>
          <Button appearance="primary" disabledFocusable={requestController.isLoading} onClick={handleSendClick}>
            {requestController.isLoading ? 'Sending' : 'Send'}
          </Button>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default React.memo(HttpTestConsole);
