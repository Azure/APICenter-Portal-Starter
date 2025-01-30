/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIV3 } from 'openapi-types';
import * as yaml from 'yaml';
import memoize from 'memoizee';
import { get } from 'lodash';
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
import makeOpenApiResolverProxy, { WithRef } from './openApiResolverProxy';

/**
 * Returns an instance of ApiSpecReader that reads OpenAPI V3 spec from a string.
 */
export default async function openApiSpecReader(specStr: string): Promise<ApiSpecReader> {
  const apiSpec = makeOpenApiResolverProxy<OpenAPIV3.Document>(yaml.parse(specStr));
  console.log(yaml.parse(specStr));

  const getBaseUrl = memoize((): string => {
    return apiSpec.servers[0].url;
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

  const REQUEST_PARAM_TYPES = ['query', 'cookie'];
  const HEADER_PARAM_TYPES = ['header'];

  const getRequestMetadata = memoize((operationName: string): RequestMetadata => {
    const operation = getOperation(operationName);

    const specParams = (operation.spec.parameters || []) as OperationParameterMetadata[];

    const mediaContent = get(operation.spec, 'requestBody.content', {}) as OpenAPIV3.RequestBodyObject['content'];
    const schemaKey = Object.keys(mediaContent)[0];
    const schema = get(operation.spec, `requestBody.content["${schemaKey}"].schema`) as
      | WithRef<OpenAPIV3.SchemaObject>
      | undefined;

    const bodyRef = schema?.$ref;

    let bodyParams: OperationParameterMetadata[] = [];
    // TODO: what if it is not an object?
    if (schema?.type === 'object') {
      bodyParams = Object.entries<OpenAPIV3.SchemaObject>(
        schema.properties as Record<string, OpenAPIV3.SchemaObject>
      ).map<OperationParameterMetadata>(([name, param]) => {
        return {
          name,
          type: schemaToTypeLabel(param),
          in: 'body',
          required: schema.required?.includes(name),
        };
      });
    }

    // TODO: check if it is correct for non body params
    const resultParams = specParams.map<OperationParameterMetadata>((specParam) => {
      const result = { ...specParam } as OperationParameterMetadata;
      if ('schema' in specParam) {
        result.type = schemaToTypeLabel(specParam.schema);
      }
      return result;
    });

    return {
      description: operation.spec.description,
      parameters: resultParams.filter((param) => REQUEST_PARAM_TYPES.includes(param.in)),
      headers: resultParams.filter((param) => HEADER_PARAM_TYPES.includes(param.in)),
      body: bodyParams,
      bodyRef,
    };
  });

  const getResponsesMetadata = memoize((operationName: string): ResponseMetadata[] => {
    const operation = getOperation(operationName);

    return Object.entries<OpenAPIV3.ResponseObject>(operation.spec.responses as any).map(([code, responseData]) => {
      const headers = Object.entries<OpenAPIV3.HeaderObject>(
        (responseData.headers || {}) as any
      ).map<OperationParameterMetadata>(([name, headerData]) => ({
        name,
        type: schemaToTypeLabel(headerData.schema as OpenAPIV3.SchemaObject),
        in: 'header',
        description: headerData.description,
      }));

      const mediaContent = responseData.content || {};
      const schemaKey = Object.keys(mediaContent)[0];
      const bodySchema = get(responseData, `content["${schemaKey}"].schema`) as
        | WithRef<OpenAPIV3.SchemaObject>
        | undefined;

      let body = [];
      if (bodySchema?.type === 'object' && bodySchema.properties) {
        body = Object.entries<OpenAPIV3.SchemaObject>(bodySchema.properties as any).map(([name, schema]) => ({
          name,
          type: schemaToTypeLabel(schema),
          in: 'body',
          description: schema.description,
        }));
      }

      return {
        code,
        description: responseData.description,
        headers: headers,
        body,
        bodyRef: bodySchema?.$ref,
      };
    });
  });

  const getOperationDefinitions = memoize((operationName: string): DefinitionMetadata[] => {
    const operation = getOperation(operationName);

    return getUsedRefsFromSubSchema(operation.spec).map((ref) => {
      const schema = resolveRef(apiSpec, ref) as OpenAPIV3.SchemaObject;

      let parameters: OperationParameterMetadata[] = [];
      if (schema.type === 'object') {
        parameters = Object.entries(schema.properties as Record<string, OpenAPIV3.SchemaObject>).map(
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
