import React, { useCallback, useMemo, useState } from 'react';
import {
  HttpTestConsole as HttpApiTestConsole,
  HttpReqData,
  HttpReqParam,
  ApiOperationMethod,
} from '@microsoft/api-docs-ui';
import { Button, Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import { getReqDataDefaults, getSchemaParamsByLocation } from './utils';

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

  const handleBodyChange = useCallback((value: string) => {
    setReqData((prev) => ({ ...prev, body: value }));
  }, []);

  return (
    <Drawer size="medium" position="end" open={isOpen} onOpenChange={onClose}>
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
            <HttpApiTestConsole.RawBody
              name="body"
              dataSamples={rawBodyDataSamples}
              value={reqData.body}
              onChange={handleBodyChange}
            />
          )}

          <HttpApiTestConsole.RequestPreview name="request" reqData={reqData} schemas={schemaParamsData} />
        </HttpApiTestConsole>
      </DrawerBody>
    </Drawer>
  );
};

export default React.memo(HttpTestConsole);
