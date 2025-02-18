import memoizee from 'memoizee';
import { groupBy } from 'lodash';
import { HttpParamSchemasByLocation, HttpBodyFormats, HttpReqData } from '@microsoft/api-docs-ui';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import { resolveOpUrlTemplate } from '@/utils/apiOperations';
import { ApiDeployment } from '@/types/apiDeployment';

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
      bodyFormat: HttpBodyFormats.RAW,
      body: undefined,
    };

    if (METHODS_WITH_FORCED_BODY.includes(operation.method)) {
      result.body = '';
    }

    metadata.parameters
      .concat(metadata.headers)
      .sort((a, b) => Number(!!b.required) - Number(!!a.required))
      .forEach((param) => {
        const paramValue = {
          name: param.name,
          value: '',
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
      headers: groupedParams.header || [],
      urlParams: groupedParams.path || [],
    };
  }
);
