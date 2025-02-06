/** Data required to identify a particular definition */
export interface ApiDefinitionId {
  apiName: string;
  versionName: string;
  definitionName: string;
}

export interface ApiSpecificationMetadata {
  name?: string;
  version?: string;
}

export interface ApiDefinition {
  name: string;
  title: string;
  description?: string;
  specification?: ApiSpecificationMetadata;
}
