/**
 * Metadata schema definition from API Center.
 */
export interface MetadataSchema {
  /** The name/key of the metadata property. */
  name: string;
  /** JSON schema string containing the type and title. */
  schema: string;
}

/**
 * Parsed schema content from the JSON schema string.
 */
export interface ParsedMetadataSchema {
  type?: string;
  title?: string;
  [key: string]: unknown;
}

/**
 * Metadata schema with parsed schema content.
 */
export interface MetadataSchemaWithTitle {
  name: string;
  title: string;
  type?: string;
}
