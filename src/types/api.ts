export interface ApiContact {
  name?: string;
  url?: string;
  email?: string;
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
  kind: string;
  description?: string;
  summary?: string;
  /** The lifecycle stage of the API, e.g., "development", "production", "retired". */
  lifecycleStage?: string;
  externalDocumentation?: ApiExternalDocumentation[];
  contacts?: ApiContact[];
  lastUpdated?: string;
}
