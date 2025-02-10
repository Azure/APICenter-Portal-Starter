import { ApiDeployment } from '@/types/apiDeployment';
import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';

/**
 * Resolves complete URL template for a given operation on given deployment.
 * If there is no deployment, it will return a complete path with base URL.
 */
export function resolveOpUrlTemplate(
  deployment: ApiDeployment | undefined,
  apiSpec: ApiSpecReader,
  operation: OperationMetadata
): string {
  const components = [deployment?.server.runtimeUri[0] || '', apiSpec.getBaseUrl(), operation.urlTemplate];

  return components.join('/').replace(/\/+/g, '/');
}
