/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIV2 } from 'openapi-types';
import * as yaml from 'yaml';
import memoize from 'memoizee';
import { sortBy, uniqBy } from 'lodash';
import {
  ApiSpecReader,
  ApiSpecTypes,
  MediaContentMetadata,
  OperationCategory,
  OperationMetadata,
  OperationParameterMetadata,
  OperationTypes,
  RequestMetadata,
  ResponseMetadata,
  SampleDataEntry,
  SchemaMetadata,
  WithRef,
} from '@/types/apiSpec';
import { httpMethodsList } from '@/constants';
import {
  gatherSampleJsonData,
  getUsedRefsFromSubSchema,
  resolveRef,
  resolveSchema,
  schemaToFieldType,
  schemaToTypeLabel,
  v2ParamMetadataToFieldType,
} from '@/utils/openApi';
import { makeOpenApiResolverProxy } from './openApiResolverProxy';

function getMediaContentSampleData(type: string, schema: WithRef<OpenAPIV2.SchemaObject>): SampleDataEntry | undefined {
  if (type === 'application/json') {
    return {
      data: JSON.stringify(gatherSampleJsonData(schema), null, 2),
      language: 'json',
    };
  }

  return undefined;
}

function resolveMediaContent(
  mediaTypes: string[] = [],
  schema?: WithRef<OpenAPIV2.SchemaObject>,
  parameters?: OperationParameterMetadata[]
): MediaContentMetadata[] {
  if (!mediaTypes.length) {
    return [];
  }

  return sortBy(
    mediaTypes.map((type) => {
      if (type === 'multipart/form-data') {
        return {
          type,
          schema: {
            typeLabel: 'object',
            properties: parameters?.filter((param) => param.in === 'formData'),
          },
          sampleData: getMediaContentSampleData(type, schema),
        };
      }

      return {
        type,
        schema: resolveSchema(schema),
        sampleData: getMediaContentSampleData(type, schema),
      };
    }),
    'type'
  );
}

/**
 * Returns an instance of ApiSpecReader that reads OpenAPI V2 spec from a string.
 */
export async function openApiV2Reader(specStr: string): Promise<ApiSpecReader> {
  const apiSpec = makeOpenApiResolverProxy<OpenAPIV2.Document>(yaml.parse(specStr));

  const getBaseUrl = memoize((): string => {
    return apiSpec.basePath || '/';
  });

  const getTagLabels = memoize((): string[] => {
    return apiSpec.tags?.map((tag) => tag.name);
  });

  const getOperationCategories = memoize((): Array<OperationCategory<OpenAPIV2.OperationObject>> => {
    const grouped = new Map<string, Array<OperationMetadata<OpenAPIV2.OperationObject>>>();

    Object.entries(apiSpec.paths).forEach(([pathName, pathData]) => {
      httpMethodsList
        .filter((method) => pathData.hasOwnProperty(method))
        .forEach((method: string) => {
          const opData = pathData[method];
          const tagName = opData.tags?.[0] || 'default';
          const categoryOps = grouped.get(tagName) || [];

          categoryOps.push({
            type: OperationTypes.DEFAULT,
            category: tagName,
            displayName: opData.summary || pathName,
            description: opData.description,
            name: `${method}${pathName}`,
            urlTemplate: pathName,
            method,
            spec: opData,
          });

          grouped.set(tagName, categoryOps);
        });
    });

    const tagOrder = apiSpec.tags?.map((tag) => tag.name) || [];
    const categories = [...grouped.entries()].map(([name, operations]) => ({
      name,
      label: name === 'default' ? 'Operations' : name,
      operations,
    }));

    return sortBy(categories, (category) => {
      if (category.name === 'default') {
        return `${String(tagOrder.length + 1).padStart(6, '0')}-zzzz`;
      }

      const idx = tagOrder.indexOf(category.name);
      if (idx >= 0) {
        return `${String(idx).padStart(6, '0')}-${category.name.toLowerCase()}`;
      }

      return `${String(tagOrder.length).padStart(6, '0')}-${category.name.toLowerCase()}`;
    });
  });

  const getOperations = memoize((): Array<OperationMetadata<OpenAPIV2.OperationObject>> => {
    return getOperationCategories().flatMap((category) => category.operations);
  });

  const getOperation = memoize((operationName: string): OperationMetadata<OpenAPIV2.OperationObject> | undefined => {
    return getOperations().find((operation) => operation.name === operationName);
  });

  const BODY_PARAM_TYPES = new Set(['body']);
  const REQUEST_PARAM_TYPES = new Set(['query', 'path', 'formData']);
  const HEADER_PARAM_TYPES = new Set(['header']);

  const getRequestMetadata = memoize((operationName: string): RequestMetadata => {
    const operation = getOperation(operationName);

    const specParams = (operation.spec?.parameters || []) as OpenAPIV2.ParameterObject[];

    const resultParams = specParams.map<OperationParameterMetadata>((specParam) => {
      const result = { ...specParam } as OperationParameterMetadata;
      result.fieldType = v2ParamMetadataToFieldType(specParam);
      result.enum = specParam.enum;
      result.defaultValue = specParam.default;

      if (specParam.schema) {
        result.type = schemaToTypeLabel(specParam.schema);
        result.fieldType = schemaToFieldType(specParam.schema);
      }
      return result;
    });

    const bodyParam = specParams.find((param) => BODY_PARAM_TYPES.has(param.in)) as
      | OpenAPIV2.InBodyParameterObject
      | undefined;

    const parameters = resultParams.filter((param) => REQUEST_PARAM_TYPES.has(param.in));

    return {
      description: operation.spec?.description,
      parameters,
      headers: uniqBy(
        resultParams.filter((param) => HEADER_PARAM_TYPES.has(param.in)),
        'name'
      ),
      body: resolveMediaContent(operation.spec?.consumes || apiSpec.consumes, bodyParam?.schema, parameters),
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
          body: resolveMediaContent(operation.spec?.consumes || apiSpec.consumes, responseData.schema),
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
