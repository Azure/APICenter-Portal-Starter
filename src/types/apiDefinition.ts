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
