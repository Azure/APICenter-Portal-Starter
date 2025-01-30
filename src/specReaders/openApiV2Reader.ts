/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import * as yaml from 'yaml';
import memoize from 'memoizee';
import {
  ApiSpecReader,
  DefinitionMetadata,
  OperationMetadata,
  OperationParameterMetadata,
  RequestMetadata,
  ResponseMetadata,
} from '@/types/apiSpec';
import { httpMethodsList } from '@/constants';
import { getUsedRefsFromSubSchema, resolveRef, schemaToTypeLabel } from '@/utils/openApi';
import makeOpenApiResolverProxy from './openApiResolverProxy';

/**
 * Returns an instance of ApiSpecReader that reads OpenAPI V2 spec from a string.
 */
export default async function openApiSpecReader(specStr: string): Promise<ApiSpecReader> {
  const apiSpec = makeOpenApiResolverProxy<OpenAPIV2.Document>(yaml.parse(specStr));
  console.log(yaml.parse(specStr));

  const getBaseUrl = memoize((): string => {
    const protocol = apiSpec.schemes[0];
    return `${protocol}://${apiSpec.host}${apiSpec.basePath}`;
  });

  const getTagLabels = memoize((): string[] => {
    return apiSpec.tags?.map((tag) => tag.name);
  });

  const getOperations = memoize((): OperationMetadata[] => {
    return (
      Object.entries(apiSpec.paths)
        // .map(([pathName, pathData]) => [pathName, resolveRef(pathData)])
        .flatMap(([pathName, pathData]) => {
          return httpMethodsList
            .filter((method) => pathData.hasOwnProperty(method))
            .map((method: string) => {
              const opData = pathData[method];
              return {
                displayName: opData.summary || pathName,
                description: opData.description,
                name: `${method}${pathName}`,
                urlTemplate: pathName,
                invocationUrl: `${getBaseUrl()}${pathName}`,
                method,
                spec: opData,
              };
            });
        })
    );
  });

  const getOperation = memoize((operationName: string): OperationMetadata | undefined => {
    return getOperations().find((operation) => operation.name === operationName);
  });

  const BODY_PARAM_TYPES = ['body', 'formData'];
  const REQUEST_PARAM_TYPES = ['query', 'path'];
  const HEADER_PARAM_TYPES = ['header'];

  const getRequestMetadata = memoize((operationName: string): RequestMetadata => {
    const operation = getOperation(operationName);

    const specParams = (operation.spec.parameters || []) as OpenAPIV2.ParameterObject[];

    const resultParams = specParams.map<OperationParameterMetadata>((specParam) => {
      const result = { ...specParam } as OperationParameterMetadata;
      if (specParam.schema) {
        result.type = schemaToTypeLabel(specParam.schema);
      }
      return result;
    });

    return {
      description: operation.spec.description,
      parameters: resultParams.filter((param) => REQUEST_PARAM_TYPES.includes(param.in)),
      headers: resultParams.filter((param) => HEADER_PARAM_TYPES.includes(param.in)),
      body: resultParams.filter((param) => BODY_PARAM_TYPES.includes(param.in)),
    };
  });

  const getResponsesMetadata = memoize((operationName: string): ResponseMetadata[] => {
    const operation = getOperation(operationName);

    return Object.entries<OpenAPIV2.ResponseObject>(operation.spec.responses as any).map(([code, responseData]) => {
      const headers = Object.entries<OpenAPIV2.HeaderObject>(
        (responseData.headers || {}) as any
      ).map<OperationParameterMetadata>(([name, headerData]) => ({
        name,
        type: headerData.type,
        in: 'header',
        description: headerData.description,
      }));

      const bodySchema = responseData.schema as OpenAPIV2.SchemaObject;

      let body = [];
      if (bodySchema.type === 'object' && bodySchema.properties) {
        body = Object.entries<OpenAPIV2.SchemaObject>(bodySchema.properties as any).map(([name, schema]) => ({
          name,
          type: schemaToTypeLabel(schema),
          in: 'body',
          description: schema.description,
        }));
      }

      return {
        code,
        description: responseData.description,
        headers,
        body,
      };
    });
  });

  const getOperationDefinitions = memoize((operationName: string): DefinitionMetadata[] => {
    const operation = getOperation(operationName);

    return getUsedRefsFromSubSchema(operation.spec).map((ref) => {
      const schema = resolveRef(apiSpec, ref) as OpenAPIV2.SchemaObject;

      let parameters: OperationParameterMetadata[] = [];
      if (schema.type === 'object') {
        parameters = Object.entries(schema.properties as Record<string, OpenAPIV2.SchemaObject>).map(
          ([name, paramSchema]) => ({
            name,
            in: '',
            type: schemaToTypeLabel(paramSchema),
            description: paramSchema.description,
            required: schema.required?.includes(name),
            readOnly: paramSchema.readOnly,
          })
        );
      }

      return {
        ref,
        parameters,
      };
    });
  });

  return {
    getBaseUrl,
    getTagLabels,
    getOperations,
    getOperation,
    getRequestMetadata,
    getResponsesMetadata,
    getOperationDefinitions,
  };
}
