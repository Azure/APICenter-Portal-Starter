import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { resolveRef } from '@/utils/openApi';
import { WithRef } from '@/types/apiSpec';

/**
 * Creates a proxy object for an OpenAPI schema that automatically resolves $ref properties.
 */
export default function makeOpenApiResolverProxy<T>(
  obj: T | OpenAPIV2.ReferenceObject | OpenAPIV3.ReferenceObject,
  root?: OpenAPI.Document,
  seenRefs: string[] = []
): WithRef<T> {
  const resolvedRoot = (root || obj) as OpenAPI.Document;

  return new Proxy(obj as object, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(target, prop): any {
      if (!(prop in target)) {
        return undefined;
      }

      const value = target[prop];
      if (typeof value === 'object' && value !== null) {
        if ('$ref' in value) {
          if (seenRefs.includes(value.$ref)) {
            return value; // Circular dependency detected, return the reference as is
          }
          return makeOpenApiResolverProxy(
            resolveRef(resolvedRoot, value.$ref),
            resolvedRoot,
            seenRefs.concat(value.$ref)
          );
        }
        return makeOpenApiResolverProxy(value, resolvedRoot, seenRefs);
      }
      return value;
    },
  }) as T;
}
