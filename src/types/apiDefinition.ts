/** The asset-type route segment used in UI URLs. */
export type ResourceType = 'apis' | 'languageModels';

/** Maps an API kind to the matching UI route segment. */
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
  /** UI route segment for the asset type, defaults to 'apis'. */
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
