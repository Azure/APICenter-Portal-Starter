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

export interface OperationParameterMetadata extends ApiOperationParameter {
  defaultValue?: string;
}

export interface RawSchemaEntry {
  schema: string;
  language: string;
}

export interface SchemaMetadata {
  $ref?: string;
  refLabel?: string;
  typeLabel: React.ReactNode;
  properties?: OperationParameterMetadata[];
  rawSchema?: RawSchemaEntry;
  isEnum?: boolean;
  isBinary?: boolean;
}

export interface SampleDataEntry {
  data: string;
  language: string;
}

export interface MediaContentMetadata {
  type: string;
  schema: SchemaMetadata;
  sampleData?: SampleDataEntry;
}

export interface RequestMetadata {
  description?: string;
  parameters?: OperationParameterMetadata[];
  headers?: OperationParameterMetadata[];
  body: MediaContentMetadata[];
}

export interface ResponseMetadata {
  code?: string;
  description?: string;
  headers?: OperationParameterMetadata[];
  body: MediaContentMetadata[];
}

export enum ApiSpecTypes {
  OpenApiV2 = 'OpenApiV2',
  OpenApiV3 = 'OpenApiV3',
  GraphQL = 'GraphQL',
  MCP = 'MCP',
}

/**
 * Api spec reader is an abstraction that allows to read spec metadata in a standardized way no matter what spec type is used.
 * It abstracts away from specific spec's schema in favor of a common interfaces defined by ourselves.
 */
export interface ApiSpecReader {
  type: ApiSpecTypes;
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
