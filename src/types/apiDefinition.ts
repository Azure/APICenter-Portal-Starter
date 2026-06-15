/** The asset-type route segment used in UI URLs. */
export type ResourceType = 'apis' | 'models';

/** Maps an API kind to the matching UI route segment. */
export function kindToResourceType(kind?: string): ResourceType {
  const k = kind?.toLowerCase();
  if (k === 'model' || k === 'languagemodel') {
    return 'models';
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
