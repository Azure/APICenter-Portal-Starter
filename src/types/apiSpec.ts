import React from 'react';
import { ApiOperation, ApiOperationParameter } from 'api-docs-ui';

export type WithRef<T> = T & { $ref?: string };

/**
 * Operation type defines how the operation is presented to the user.
 * DEFAULT type will cover most of the cases but if a special treatment is needed then a separate type can be defined.
 * It can be used to have different details UI implementation for example.
 */
export enum OperationTypes {
  DEFAULT = 'default',
  MCP_RESOURCE = 'mcpResource',
}

export interface OperationMetadata<T = object> extends ApiOperation {
  type: OperationTypes;
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

export interface EnumProperty {
  name: string;
  description?: string;
}

export interface StaticProperty {
  name: string;
  value: string;
  description?: string;
}

interface BaseSchemaMetadata {
  $ref?: string;
  refLabel?: string;
  typeLabel: React.ReactNode;
  properties?: unknown;
  rawSchema?: RawSchemaEntry;
  isBinary?: boolean;
}

/**
 * Static schema represents static data structure that already have assigned values.
 */
export interface StaticSchemaMetadata extends BaseSchemaMetadata {
  properties?: StaticProperty[];
  isEnum?: false;
  isStatic: true;
}

/**
 * Enum schema represents an enum of static values (all values are considered strings).
 */
export interface EnumSchemaMetadata extends BaseSchemaMetadata {
  properties?: EnumProperty[];
  isEnum: true;
  isStatic: true;
}

/**
 * Dynamic schema metadata.
 */
export interface DynamicSchemaMetadata extends BaseSchemaMetadata {
  properties?: OperationParameterMetadata[];
  isEnum?: false;
  isStatic?: false;
}

export type SchemaMetadata = DynamicSchemaMetadata | StaticSchemaMetadata | EnumSchemaMetadata;

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
