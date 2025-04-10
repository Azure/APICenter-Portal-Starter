import { DynamicSchemaMetadata, EnumSchemaMetadata, SchemaMetadata, StaticSchemaMetadata } from '@/types/apiSpec';

export function isEnumSchemaMetadata(schema: SchemaMetadata): schema is EnumSchemaMetadata {
  return schema.isStatic && schema.isEnum;
}

export function isStaticSchemaMetadata(schema: SchemaMetadata): schema is StaticSchemaMetadata {
  return schema.isStatic && !schema.isEnum;
}

export function isDynamicSchemaMetadata(schema: SchemaMetadata): schema is DynamicSchemaMetadata {
  return !schema.isStatic && !schema.isEnum;
}
