export interface ApiContact {
  name?: string;
  url?: string;
  email?: string;
}

/**
 * Source information for Git-imported assets such as skills.
 */
export interface ApiSource {
  /** The source type, e.g. "git". */
  type?: string;
  /** Browsable URL of the repository folder containing the asset, when it can be resolved. */
  url?: string;
}

export interface ApiExternalDocumentation {
  title?: string;
  description?: string;
  url?: string;
}

/**
 * The API contract.
 */
export interface ApiMetadata {
  name: string;
  title: string;
  /** The kind of the API, e.g., "REST". */
  kind?: string;
  description?: string;
  summary?: string;
  /** The lifecycle stage of the API, e.g., "development", "production", "retired". */
  lifecycleStage?: string;
  externalDocumentation?: ApiExternalDocumentation[];
  contacts?: ApiContact[];
  customProperties?: Record<string, unknown>;
  lastUpdated?: string;
  resourceIds?: string[];
  /** Source information for Git-imported assets such as skills. */
  source?: ApiSource;
}
