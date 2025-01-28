/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import memoize from 'memoizee';
import { OperationMetadata } from '@/types/apiSpec';

const httpMethodsList = Object.keys(OpenAPIV3.HttpMethods).map((method) => method.toLowerCase());

const isV2 = memoize((apiSpec: OpenAPI.Document): apiSpec is OpenAPIV2.Document => {
  return (apiSpec as any).swagger === '2.0';
});

const getBaseUrl = memoize((apiSpec: OpenAPI.Document): string => {
  if (isV2(apiSpec)) {
    const protocol = apiSpec.schemes[0];
    return `${protocol}://${apiSpec.host}${apiSpec.basePath}`;
  }

  return apiSpec.servers[0].url;
});

const getOperations = memoize((apiSpec: OpenAPI.Document): OperationMetadata[] => {
  return Object.entries(apiSpec.paths).flatMap(([pathName, pathData]) => {
    return httpMethodsList
      .filter((method) => pathData.hasOwnProperty(method))
      .map((method: OpenAPIV3.HttpMethods) => {
        return {
          displayName: pathName,
          description: pathData[method].description,
          name: `${method}${pathName}`,
          urlTemplate: `${getBaseUrl(apiSpec)}${pathName}`,
          method,
        };
      });
  });
});

const OpenApiParser = {
  getOperations,
};

export default OpenApiParser;
