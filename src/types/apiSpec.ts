import React from 'react';
import { ApiOperation, ApiOperationParameter } from '@microsoft/api-docs-ui';

export type WithRef<T> = T & { $ref?: string };

export interface OperationMetadata<T = object> extends ApiOperation {
  category: string;
  invocationUrl?: string;
  spec?: T;
}

export interface OperationCategory<T = object> {
  name: string;
  label: string;
  operations: Array<OperationMetadata<T>>;
}

export type OperationParameterMetadata = ApiOperationParameter;

export interface SchemaMetadata {
  $ref?: string;
  typeLabel: React.ReactNode;
  properties?: OperationParameterMetadata[];
  isEnum?: boolean;
}

export interface RequestMetadata {
  description?: string;
  parameters?: OperationParameterMetadata[];
  headers?: OperationParameterMetadata[];
  body: SchemaMetadata;
}

export interface ResponseMetadata {
  code?: string;
  description?: string;
  headers?: OperationParameterMetadata[];
  body: SchemaMetadata;
}

export interface ApiSpecReader {
  getBaseUrl: () => string;
  getTagLabels: () => string[];
  getOperationCategories: () => OperationCategory[];
  getOperations: () => OperationMetadata[];
  getOperation: (operationName: string) => OperationMetadata;
  getRequestMetadata: (operationName: string) => RequestMetadata;
  getResponsesMetadata: (operationName: string) => ResponseMetadata[];
  getOperationDefinitions: (operationName: string) => SchemaMetadata[];
}

export type ApiSpecReaderFactory = (apiSpec: string) => Promise<ApiSpecReader> | ApiSpecReader;
