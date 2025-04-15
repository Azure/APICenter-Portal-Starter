import { HttpReqParam } from '@microsoft/api-docs-ui';
import { ApiDeployment } from '@/types/apiDeployment';
import { OperationMetadata } from '@/types/apiSpec';

/**
 * Resolves complete URL template for a given operation on given deployment.
 * If there is no deployment, it will return a complete path with base URL.
 */
export function resolveOpUrlTemplate(operation?: OperationMetadata, deployment?: ApiDeployment): string {
  const components = [deployment?.server.runtimeUri[0] || '', operation?.urlTemplate || ''];

  return components.join('/').replace(/\/+/g, '/').replace(':\/', '://');
}

const URL_TEMPLATE_PARAM_REGEX = /{([^}]+)}/g;

export function getUrlTemplateParams(urlTemplate: string): string[] {
  const matches = urlTemplate.match(URL_TEMPLATE_PARAM_REGEX);
  if (!matches) {
    return [];
  }

  return matches.map((match) => match.replace(/[{}]/g, ''));
}

export function resolveUrlTemplate(urlTemplate: string, urlParams: HttpReqParam[]): string {
  return urlTemplate.replace(URL_TEMPLATE_PARAM_REGEX, (match, param) => {
    const urlParam = urlParams.find((p) => p.name === param);
    return urlParam?.value || match;
  });
}
