/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIV2 } from 'openapi-types';
import * as yaml from 'yaml';
import memoize from 'memoizee';
import {
  ApiSpecReader,
  ApiSpecTypes,
  OperationCategory,
  OperationMetadata,
  OperationParameterMetadata,
  RequestMetadata,
  ResponseMetadata,
  SchemaMetadata,
} from '@/types/apiSpec';
import { httpMethodsList } from '@/constants';
import { getUsedRefsFromSubSchema, resolveRef, resolveSchema, schemaToTypeLabel } from '@/utils/openApi';
import makeOpenApiResolverProxy from './openApiResolverProxy';

/**
 * Returns an instance of ApiSpecReader that reads OpenAPI V2 spec from a string.
 */
export default async function openApiSpecReader(specStr: string): Promise<ApiSpecReader> {
  const apiSpec = makeOpenApiResolverProxy<OpenAPIV2.Document>(yaml.parse(specStr));

  const getBaseUrl = memoize((): string => {
    return apiSpec.basePath || '/';
  });

  const getTagLabels = memoize((): string[] => {
    return apiSpec.tags?.map((tag) => tag.name);
  });

  const getOperationCategories = memoize((): Array<OperationCategory<OpenAPIV2.OperationObject>> => {
    return [
      {
        name: 'default',
        label: 'Operations',
        operations: Object.entries(apiSpec.paths).flatMap(([pathName, pathData]) => {
          return httpMethodsList
            .filter((method) => pathData.hasOwnProperty(method))
            .map((method: string) => {
              const opData = pathData[method];
              return {
                category: 'default',
                displayName: opData.summary || pathName,
                description: opData.description,
                name: `${method}${pathName}`,
                urlTemplate: pathName,
                method,
                spec: opData,
              };
            });
        }),
      },
    ];
  });

  const getOperations = memoize((): Array<OperationMetadata<OpenAPIV2.OperationObject>> => {
    return getOperationCategories().flatMap((category) => category.operations);
  });

  const getOperation = memoize((operationName: string): OperationMetadata<OpenAPIV2.OperationObject> | undefined => {
    return getOperations().find((operation) => operation.name === operationName);
  });

  const BODY_PARAM_TYPES = ['body'];
  const REQUEST_PARAM_TYPES = ['query', 'path', 'formData'];
  const HEADER_PARAM_TYPES = ['header'];

  const getRequestMetadata = memoize((operationName: string): RequestMetadata => {
    const operation = getOperation(operationName);

    const specParams = (operation.spec?.parameters || []) as OpenAPIV2.ParameterObject[];

    const resultParams = specParams.map<OperationParameterMetadata>((specParam) => {
      const result = { ...specParam } as OperationParameterMetadata;
      if (specParam.schema) {
        result.type = schemaToTypeLabel(specParam.schema);
      }
      return result;
    });

    const bodyParam = specParams.find((param) => BODY_PARAM_TYPES.includes(param.in)) as
      | OpenAPIV2.InBodyParameterObject
      | undefined;

    return {
      description: operation.spec?.description,
      parameters: resultParams.filter((param) => REQUEST_PARAM_TYPES.includes(param.in)),
      headers: resultParams.filter((param) => HEADER_PARAM_TYPES.includes(param.in)),
      body: resolveSchema(bodyParam?.schema),
    };
  });

  const getResponsesMetadata = memoize((operationName: string): ResponseMetadata[] => {
    const operation = getOperation(operationName);

    return Object.entries<OpenAPIV2.ResponseObject>((operation.spec?.responses || {}) as any).map(
      ([code, responseData]) => {
        const headers = Object.entries<OpenAPIV2.HeaderObject>(
          (responseData.headers || {}) as any
        ).map<OperationParameterMetadata>(([name, headerData]) => ({
          name,
          type: headerData.type,
          in: 'header',
          description: headerData.description,
        }));

        return {
          code,
          description: responseData.description,
          headers,
          body: resolveSchema(responseData.schema),
        };
      }
    );
  });

  const getOperationDefinitions = memoize((operationName: string): SchemaMetadata[] => {
    const operation = getOperation(operationName);

    return getUsedRefsFromSubSchema(operation.spec).map((ref) =>
      resolveSchema(resolveRef(apiSpec, ref) as OpenAPIV2.SchemaObject)
    );
  });

  return {
    type: ApiSpecTypes.OpenApiV2,
    getBaseUrl,
    getTagLabels,
    getOperationCategories,
    getOperations,
    getOperation,
    getRequestMetadata,
    getResponsesMetadata,
    getOperationDefinitions,
  };
}
