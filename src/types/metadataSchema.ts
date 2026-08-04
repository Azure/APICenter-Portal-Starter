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
 * Enumerated value definition used by `oneOf` in a JSON schema.
 */
export interface SchemaOneOfEntry {
  const?: string;
  description?: string;
}

/**
 * Parsed schema content from the JSON schema string.
 */
export interface ParsedMetadataSchema {
  type?: string;
  title?: string;
  enum?: string[];
  oneOf?: SchemaOneOfEntry[];
  /** Present for `type: 'array'` (multi-select) properties. */
  items?: {
    type?: string;
    enum?: string[];
    oneOf?: SchemaOneOfEntry[];
  };
  [key: string]: unknown;
}

/**
 * Metadata schema with parsed schema content.
 */
export interface MetadataSchemaWithTitle {
  name: string;
  title: string;
  type?: string;
  options?: Array<{ value: string; label: string }>;
  /** True when the property holds an array of values (multi-select). */
  isMultiValue?: boolean;
}
