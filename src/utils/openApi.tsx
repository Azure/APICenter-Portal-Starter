import React from 'react';
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { Link } from '@fluentui/react-components';
import { get } from 'lodash';
import { WithRef, SchemaMetadata, OperationParameterMetadata } from '@/types/apiSpec';

export function resolveRef<T extends object>(schema: OpenAPI.Document, $ref: string): T | undefined {
  return {
    $ref,
    ...get(schema, $ref.split('/').slice(1)),
  };
}

export function getRefLabel($ref?: string): string {
  return $ref?.split('/').pop() || '';
}

export function getUsedRefsFromSubSchema<T extends object>(schema?: T): string[] {
  if (!schema) {
    return [];
  }

  return Array.from(
    new Set(
      JSON.stringify(schema)
        .matchAll(/"\$ref":\s*"([^"]+)"/gi)
        .map((match) => match[1])
    )
  );
}

/**
 * Returns type label based on schema object.
 */
export function schemaToTypeLabel<T extends WithRef<OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject>>(
  schema?: T
): React.ReactNode {
  if (!schema) {
    return null;
  }

  if (schema.type === 'array') {
    return <>[{schemaToTypeLabel(schema.items as T)}]</>;
  }

  if (schema.$ref) {
    const label = getRefLabel(schema.$ref);
    return <Link href={`#${label}`}>{getRefLabel(schema.$ref)}</Link>;
  }

  if (!schema.type) {
    return 'unknown';
  }

  if (schema.type === 'object') {
    if (!schema.properties?.length && schema.additionalProperties) {
      return `{ [key]: ${schemaToTypeLabel(schema.additionalProperties as T)} }`;
    }
    return `{ [key]: unknown }`;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.join(' | ');
  }

  if (schema.format) {
    return `${schema.type}(${schema.format})`;
  }

  return schema.type;
}

/**
 * Recursively constructs sample data for given schema from example values.
 */
export function gatherSampleJsonData(
  schema: WithRef<OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject>,
  isRequired = false
): unknown {
  if (schema.type === 'object') {
    const entries = Object.entries(schema.properties || {})
      .map<[string, unknown]>(([key, propSchema]) => [
        key,
        gatherSampleJsonData(propSchema, schema.required?.includes(key)),
      ])
      // Filter out empty values if they are not required
      .filter(([key, value]) => {
        if (schema.required?.includes(key)) {
          return true;
        }

        const property = schema.properties[key] as OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject;
        if (property.type === 'array' && value) {
          return !!(value as unknown[]).length;
        }

        if (property.type === 'object' && value) {
          return !!Object.keys(value as object).length;
        }

        return value !== undefined;
      });

    if (!entries.length) {
      return undefined;
    }
    return Object.fromEntries(entries);
  }

  if (schema.type === 'array') {
    return [gatherSampleJsonData(schema.items)].filter((v) => v !== undefined);
  }

  if (schema.example) {
    return schema.example;
  }

  if (!isRequired) {
    return undefined;
  }

  switch (schema.type) {
    case 'string':
      return '';

    case 'number':
    case 'integer':
      return 0;

    case 'boolean':
      return false;

    default:
      return undefined;
  }
}

/**
 * Resolves OpenAPI schema object to a schema metadata object that we can use to easily render schema details.
 */
export function resolveSchema(
  schema?: WithRef<OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject>,
  placement = ''
): SchemaMetadata | undefined {
  if (!schema) {
    return undefined;
  }

  const properties = Object.entries(schema.properties || {}).map<OperationParameterMetadata>(([name, propSchema]) => ({
    name,
    type: schemaToTypeLabel(propSchema),
    in: placement,
    description: propSchema.description,
    required: schema.required?.includes(name),
    readOnly: propSchema.readOnly,
  }));

  if (schema.additionalProperties) {
    properties.push({
      name: '[key]',
      type: schemaToTypeLabel(schema.additionalProperties as OpenAPIV3.SchemaObject),
      in: placement,
      description: 'Additional properties',
    });
  }

  return {
    $ref: schema.$ref || '',
    refLabel: getRefLabel(schema.$ref),
    typeLabel: schemaToTypeLabel(schema),
    properties,
    rawSchema: {
      schema: JSON.stringify(schema, null, 2),
      language: 'json',
    },
  };
}
