/** The resource collection prefix used in API Center data-plane URLs. */
export type ResourceType = 'apis' | 'languageModels';

/** Maps an API kind to the data-plane resource collection prefix. */
export function kindToResourceType(kind?: string): ResourceType {
  if (kind?.toLowerCase() === 'languagemodel') {
    return 'languageModels';
  }
  return 'apis';
}

/** Data required to identify a particular definition */
export interface ApiDefinitionId {
  apiName: string;
  versionName: string;
  definitionName: string;
  /** Resource collection prefix, defaults to 'apis'. */
  resourceType?: ResourceType;
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
