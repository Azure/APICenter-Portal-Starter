import { ActiveFilterData } from '@/types/apiFilters';
import { ApiMetadata } from '@/types/api';
import { ApiVersion } from '@/types/apiVersion';
import { ApiDeployment } from '@/types/apiDeployment';
import { ApiDefinition, ApiDefinitionId } from '@/types/apiDefinition';
import { ApiEnvironment } from '@/types/apiEnvironment';

export interface IApiService {
  getApis(search: string, filters?: ActiveFilterData[]): Promise<ApiMetadata[]>;
  getApi(id: string): Promise<ApiMetadata>;
  getVersions(apiId: string): Promise<ApiVersion[]>;
  getDeployments(apiId: string): Promise<ApiDeployment[]>;
  getDefinitions(apiId: string, version: string): Promise<ApiDefinition[]>;
  getDefinition(definitionId: ApiDefinitionId): Promise<ApiDefinition>;
  getSpecificationLink(definitionId: ApiDefinitionId): Promise<string>;
  getSpecification(definitionId: ApiDefinitionId): Promise<string | undefined>;
  getEnvironment(environmentId: string): Promise<ApiEnvironment>;
}
