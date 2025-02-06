import React from 'react';
import { ApiOperation, ApiOperationParameter } from '@microsoft/api-docs-ui';

export type WithRef<T> = T & { $ref?: string };

export interface OperationMetadata<T = object> extends ApiOperation {
  category: string;
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
  /**
   * Returns base url for api (should not include host as it is determined from a particular deployment).
   *
   * @example
   * spec.getBaseUrl() => '/api/v1'
   */
  getBaseUrl: () => string;
  /** Returns api tags list (used for informational purpose only) */
  getTagLabels: () => string[];
  getOperationCategories: () => OperationCategory[];
  getOperations: () => OperationMetadata[];
  getOperation: (operationName: string) => OperationMetadata;
  getRequestMetadata: (operationName: string) => RequestMetadata;
  getResponsesMetadata: (operationName: string) => ResponseMetadata[];
  /**
   * Returns schema definitions for a given operation.
   * Definitions are sub-schemas that can be referenced from other parts of the spec.
   * For example in OpenAPI it those are components.schemas and in GraphQL it's type definitions.
   */
  getOperationDefinitions: (operationName: string) => SchemaMetadata[];
}

export type ApiSpecReaderFactory = (apiSpec: string) => Promise<ApiSpecReader> | ApiSpecReader;
