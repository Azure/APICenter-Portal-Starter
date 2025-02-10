import { ActiveFilterData } from '@/types/apiFilters';
import { ApiMetadata } from '@/types/api';
import { ApiVersion } from '@/types/apiVersion';
import { ApiDeployment } from '@/types/apiDeployment';
import { ApiDefinition } from '@/types/apiDefinition';
import { ApiEnvironment } from '@/types/apiEnvironment';

export interface IApiService {
  getApis(search: string, filters?: ActiveFilterData[]): Promise<ApiMetadata[]>;
  getApi(id: string): Promise<ApiMetadata>;
  getVersions(apiId: string): Promise<ApiVersion[]>;
  getDeployments(apiId: string): Promise<ApiDeployment[]>;
  getDefinitions(apiId: string, version: string): Promise<ApiDefinition[]>;
  getDefinition(apiName: string, versionName: string, definitionName: string): Promise<ApiDefinition>;
  getSpecificationLink(apiName: string, versionName: string, definitionName: string): Promise<string>;
  getEnvironment(environmentId: string): Promise<ApiEnvironment>;
}
