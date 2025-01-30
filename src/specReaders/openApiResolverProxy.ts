import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { resolveRef } from '@/utils/openApi';
import { WithRef } from '@/types/apiSpec';

/**
 * Creates a proxy object for an OpenAPI schema that automatically resolves $ref properties.
 */
export default function makeOpenApiResolverProxy<T>(
  obj: T | OpenAPIV2.ReferenceObject | OpenAPIV3.ReferenceObject,
  root?: OpenAPI.Document
): WithRef<T> {
  const resolvedRoot = (root || obj) as OpenAPI.Document;

  return new Proxy(obj as object, {
    get(target, prop) {
      if (!(prop in target)) {
        return undefined;
      }

      const value = target[prop];
      if (typeof value === 'object' && value !== null) {
        if ('$ref' in value) {
          return makeOpenApiResolverProxy(resolveRef(resolvedRoot, value.$ref), resolvedRoot);
        }
        return makeOpenApiResolverProxy(value, resolvedRoot);
      }
      return value;
    },
  }) as T;
}
