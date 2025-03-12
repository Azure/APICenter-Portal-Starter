/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIV3 } from 'openapi-types';
import * as yaml from 'yaml';
import memoize from 'memoizee';
import { get, sortBy, uniqBy } from 'lodash';
import {
  WithRef,
  ApiSpecReader,
  OperationMetadata,
  OperationParameterMetadata,
  RequestMetadata,
  ResponseMetadata,
  SchemaMetadata,
  OperationCategory,
  ApiSpecTypes,
  MediaContentMetadata,
  SampleDataEntry,
} from '@/types/apiSpec';
import { httpMethodsList } from '@/constants';
import {
  gatherSampleJsonData,
  getUsedRefsFromSubSchema,
  resolveRef,
  resolveSchema,
  schemaToTypeLabel,
} from '@/utils/openApi';
import makeOpenApiResolverProxy from './openApiResolverProxy';

function getMediaContentSampleData(type: string, schema: WithRef<OpenAPIV3.SchemaObject>): SampleDataEntry | undefined {
  if (type === 'application/json') {
    return {
      data: JSON.stringify(gatherSampleJsonData(schema), null, 2),
      language: 'json',
    };
  }

  return undefined;
}

function resolveMediaContent(content: { [media: string]: OpenAPIV3.MediaTypeObject } = {}): MediaContentMetadata[] {
  return sortBy(
    Object.entries(content).map(([type, mediaData]) => ({
      type,
      schema: resolveSchema(mediaData.schema as WithRef<OpenAPIV3.SchemaObject>),
      sampleData: getMediaContentSampleData(type, mediaData.schema as WithRef<OpenAPIV3.SchemaObject>),
    })),
    'type'
  );
}

/**
 * Returns an instance of ApiSpecReader that reads OpenAPI V3 spec from a string.
 */
export default async function openApiSpecReader(specStr: string): Promise<ApiSpecReader> {
  const apiSpec = makeOpenApiResolverProxy<OpenAPIV3.Document>(yaml.parse(specStr));

  const getBaseUrl = memoize((): string => {
    return apiSpec.servers?.[0].url;
  });

  const getTagLabels = memoize((): string[] => {
    return apiSpec.tags?.map((tag) => tag.name);
  });

  const getOperationCategories = memoize((): Array<OperationCategory<OpenAPIV3.OperationObject>> => {
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
                description: opData.summary,
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

  const getOperations = memoize((): Array<OperationMetadata<OpenAPIV3.OperationObject>> => {
    return getOperationCategories().flatMap((category) => category.operations);
  });

  const getOperation = memoize((operationName: string): OperationMetadata<OpenAPIV3.OperationObject> | undefined => {
    return getOperations().find((operation) => operation.name === operationName);
  });

  const REQUEST_PARAM_TYPES = ['path', 'query', 'cookie'];
  const HEADER_PARAM_TYPES = ['header'];

  const getRequestMetadata = memoize((operationName: string): RequestMetadata => {
    const operation = getOperation(operationName);

    const specParams = (operation.spec?.parameters || []) as OpenAPIV3.ParameterObject[];

    const resultParams = specParams.map<OperationParameterMetadata>((specParam) => {
      const result = { ...specParam } as unknown as OperationParameterMetadata;

      if ('schema' in specParam) {
        const schema = specParam.schema as OpenAPIV3.NonArraySchemaObject;
        result.type = schemaToTypeLabel(schema);
        result.enum = schema.enum;
        result.defaultValue = schema.default;
      }
      return result;
    });

    return {
      description: operation.spec?.description,
      parameters: resultParams.filter((param) => REQUEST_PARAM_TYPES.includes(param.in)),
      headers: uniqBy(
        resultParams.filter((param) => HEADER_PARAM_TYPES.includes(param.in)),
        'name'
      ),
      body: resolveMediaContent(get(operation.spec, 'requestBody.content') as OpenAPIV3.RequestBodyObject['content']),
    };
  });

  const getResponsesMetadata = memoize((operationName: string): ResponseMetadata[] => {
    const operation = getOperation(operationName);

    return Object.entries<OpenAPIV3.ResponseObject>((operation.spec?.responses || {}) as any).map(
      ([code, responseData]) => {
        const headers = Object.entries<OpenAPIV3.HeaderObject>(
          (responseData.headers || {}) as any
        ).map<OperationParameterMetadata>(([name, headerData]) => ({
          name,
          type: schemaToTypeLabel(headerData.schema as OpenAPIV3.SchemaObject),
          in: 'header',
          description: headerData.description,
        }));

        return {
          code,
          description: responseData.description,
          headers: headers,
          body: resolveMediaContent(responseData.content),
        };
      }
    );
  });

  const getOperationDefinitions = memoize((operationName: string): SchemaMetadata[] => {
    const operation = getOperation(operationName);

    return getUsedRefsFromSubSchema(operation.spec).map((ref) =>
      resolveSchema(resolveRef(apiSpec, ref) as OpenAPIV3.SchemaObject)
    );
  });

  return {
    type: ApiSpecTypes.OpenApiV3,
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
