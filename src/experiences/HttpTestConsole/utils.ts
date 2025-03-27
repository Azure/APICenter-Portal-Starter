import memoizee from 'memoizee';
import { groupBy, uniq, uniqBy } from 'lodash';
import xmlFormat from 'xml-formatter';
import { HttpBodyFormats, HttpParamSchemasByLocation, HttpReqData } from '@microsoft/api-docs-ui';
import { ApiSpecReader, OperationMetadata, OperationParameterMetadata } from '@/types/apiSpec';
import { resolveOpUrlTemplate } from '@/utils/apiOperations';
import { ApiDeployment } from '@/types/apiDeployment';
import useHttpTestRequestController from '@/hooks/useHttpTestRequestController';

export function inToParamsCollectionName(inValue: string): string {
  if (inValue === 'header') {
    return 'headers';
  }
  return inValue;
}

export const getFormDataFieldsMetadata = memoizee(
  (apiSpec: ApiSpecReader, operation: OperationMetadata): OperationParameterMetadata[] => {
    const requestMetadata = apiSpec.getRequestMetadata(operation.name);
    const body = requestMetadata.body.find((b) => b.type === 'multipart/form-data');

    return body?.schema.properties || [];
  }
);

export const getReqBodySupportedFormats = memoizee(
  (apiSpec: ApiSpecReader, operation: OperationMetadata): HttpBodyFormats[] => {
    const metadata = apiSpec.getRequestMetadata(operation.name);
    const result = uniq(
      metadata.body.map((body) => {
        if (body.type === 'multipart/form-data') {
          return HttpBodyFormats.FormData;
        }

        if (body.schema?.isBinary) {
          return HttpBodyFormats.Binary;
        }

        return HttpBodyFormats.Raw;
      })
    );

    if (!result.length) {
      return [HttpBodyFormats.Raw];
    }
    return result;
  }
);

const METHODS_WITH_FORCED_BODY = ['post', 'put', 'patch'];
/**
 * Returns default request data for a given operation.
 */
export const getReqDataDefaults = memoizee(
  (apiSpec: ApiSpecReader, operation?: OperationMetadata, deployment?: ApiDeployment): HttpReqData => {
    const metadata = apiSpec.getRequestMetadata(operation.name);

    const result: HttpReqData = {
      urlTemplate: resolveOpUrlTemplate(apiSpec, operation, deployment),
      method: operation.method,
      urlParams: [],
      query: [],
      headers: [],
      body: undefined,
    };

    if (METHODS_WITH_FORCED_BODY.includes(operation.method)) {
      const format = getReqBodySupportedFormats(apiSpec, operation)[0];
      result.body = {
        format,
        value: format === HttpBodyFormats.FormData ? {} : '',
      };
    }

    metadata.parameters
      .concat(metadata.headers)
      .sort((a, b) => Number(!!b.required) - Number(!!a.required))
      .forEach((param) => {
        const paramValue = {
          name: param.name,
          value: param.defaultValue || '',
        };

        switch (param.in) {
          case 'path':
            result.urlParams.push(paramValue);
            break;

          case 'query':
            result.query.push(paramValue);
            break;

          case 'header':
            result.headers.push(paramValue);
            break;
        }
      });

    return result;
  }
);

const DEFAULT_HEADER_PARAMS: OperationParameterMetadata[] = [
  {
    name: 'Authorization',
    type: 'string',
    in: 'header',
    required: false,
    description: 'Bearer token',
    isSecret: true,
  },
];

/**
 * Returns schema parameters grouped by location for a given operation normalized for http test console.
 * It is useful to map apply schema settings to particular params like required state, data type etc.
 */
export const getSchemaParamsByLocation = memoizee(
  (apiSpec: ApiSpecReader, operation: OperationMetadata): HttpParamSchemasByLocation => {
    const requestMetadata = apiSpec.getRequestMetadata(operation?.name);
    const groupedParams = groupBy(requestMetadata.parameters.concat(requestMetadata.headers), 'in');

    return {
      query: groupedParams.query || [],
      headers: uniqBy((groupedParams.header || []).concat(DEFAULT_HEADER_PARAMS), 'name'),
      urlParams: groupedParams.path || [],
    };
  }
);

export const stringifyResponse = memoizee(
  (response: ReturnType<typeof useHttpTestRequestController>['response']): string | null => {
    if (!response) {
      return null;
    }

    const headersString = Object.entries(response.headers)
      .map(([name, value]) => `${name}: ${value}`)
      .join('\n');

    const contentType = response.headers['content-type'];
    let formatedBody = response.body.toString();

    if (contentType?.includes('json')) {
      try {
        formatedBody = JSON.stringify(JSON.parse(response.body.toString()), null, 2);
      } catch {}
    } else if (contentType?.includes('xml')) {
      formatedBody = xmlFormat(response.body.toString());
    }

    return [`HTTP/1.1 ${response.statusCode} ${response.statusText}`, headersString, formatedBody].join('\n\n');
  }
);
