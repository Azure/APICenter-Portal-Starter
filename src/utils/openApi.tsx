import React from 'react';
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { Link } from '@fluentui/react-components';
import { get } from 'lodash';
import { WithRef } from '@/specReaders/openApiResolverProxy';

export function resolveRef<T extends object>(schema: OpenAPI.Document, $ref: string): T | undefined {
  return {
    $ref,
    ...get(schema, $ref.split('/').slice(1)),
  };
}

export function getRefLabel($ref: string): string {
  return $ref.split('/').pop() || '';
}

export function getUsedRefsFromSubSchema<T extends object>(schema: T): string[] {
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
  if (schema.$ref) {
    const label = getRefLabel(schema.$ref);
    return <Link href={`#${label}`}>{getRefLabel(schema.$ref)}</Link>;
  }

  if (!schema?.type) {
    return 'unknown';
  }

  if (schema.type === 'array') {
    return <>{schemaToTypeLabel(schema.items as T)}[]</>;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.join(' | ');
  }

  if (schema.format) {
    return `${schema.type} (${schema.format})`;
  }

  return schema.type;
}
