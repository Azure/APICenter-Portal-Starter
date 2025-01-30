import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { ApiOperation, ApiOperationParameter } from '@microsoft/api-docs-ui';
import React from 'react';

export interface OperationMetadata extends ApiOperation {
  invocationUrl: string;
  spec: OpenAPIV2.OperationObject | OpenAPIV3.OperationObject;
}

export interface OperationParameterMetadata extends Omit<ApiOperationParameter, 'type'> {
  type: React.ReactNode;
}

export interface RequestMetadata {
  description?: string;
  parameters: OperationParameterMetadata[];
  headers: OperationParameterMetadata[];
  body: OperationParameterMetadata[];
  bodyRef?: string;
}

export interface ResponseMetadata {
  code: string;
  description?: string;
  headers: OperationParameterMetadata[];
  body: OperationParameterMetadata[];
  bodyRef?: string;
}

export interface DefinitionMetadata {
  ref: string;
  parameters: OperationParameterMetadata[];
}

export interface ApiSpecReader {
  getBaseUrl: () => string;
  getTagLabels: () => string[];
  getOperations: () => OperationMetadata[];
  getOperation: (operationName: string) => OperationMetadata;
  getRequestMetadata: (operationName: string) => RequestMetadata;
  getResponsesMetadata: (operationName: string) => ResponseMetadata[];
  getOperationDefinitions: (operationName: string) => DefinitionMetadata[];
}

export type ApiSpecReaderFactory = (apiSpec: string) => Promise<ApiSpecReader> | ApiSpecReader;
