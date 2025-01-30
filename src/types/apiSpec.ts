import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { ApiOperation, ApiOperationParameter } from '@microsoft/api-docs-ui';
import React from 'react';

export type WithRef<T> = T & { $ref?: string };

export interface OperationMetadata extends ApiOperation {
  invocationUrl: string;
  spec: OpenAPIV2.OperationObject | OpenAPIV3.OperationObject;
}

export type OperationParameterMetadata = ApiOperationParameter;

// TODO: should there also be description
export interface SchemaMetadata {
  $ref: string;
  typeLabel: React.ReactNode;
  properties: OperationParameterMetadata[];
  isObject: boolean;
}

export interface RequestMetadata {
  description?: string;
  parameters: OperationParameterMetadata[];
  headers: OperationParameterMetadata[];
  body: SchemaMetadata;
}

export interface ResponseMetadata {
  code: string;
  description?: string;
  headers: OperationParameterMetadata[];
  body: SchemaMetadata;
}

export interface ApiSpecReader {
  getBaseUrl: () => string;
  getTagLabels: () => string[];
  getOperations: () => OperationMetadata[];
  getOperation: (operationName: string) => OperationMetadata;
  getRequestMetadata: (operationName: string) => RequestMetadata;
  getResponsesMetadata: (operationName: string) => ResponseMetadata[];
  getOperationDefinitions: (operationName: string) => SchemaMetadata[];
}

export type ApiSpecReaderFactory = (apiSpec: string) => Promise<ApiSpecReader> | ApiSpecReader;
