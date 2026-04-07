import { ActiveFilterData } from '@/types/apiFilters';
import { ApiMetadata } from '@/types/api';
import { ApiVersion } from '@/types/apiVersion';
import { ApiDeployment } from '@/types/apiDeployment';
import { ApiDefinition, ApiDefinitionId, ResourceType } from '@/types/apiDefinition';
import { ApiEnvironment } from '@/types/apiEnvironment';
import { ApiAuthScheme, ApiAuthSchemeMetadata } from '@/types/apiAuth';
import { Server } from '@/types/server';
import { MetadataSchema } from '@/types/metadataSchema';
import { PluginDetails } from '@/types/plugin';
import { SkillEvaluationResult } from '@/types/skillEvaluation';

export interface PaginatedResult<T> {
  value: T[];
  nextLink?: string;
}

export interface IApiService {
  getApis(search: string, filters?: ActiveFilterData[], isSemanticSearch?: boolean): Promise<PaginatedResult<ApiMetadata>>;
  getApisByNextLink(nextLink: string): Promise<PaginatedResult<ApiMetadata>>;
  getApi(id: string, resourceType?: ResourceType): Promise<ApiMetadata>;
  getServer(name: string): Promise<Server | undefined>;
  getVersions(apiId: string, resourceType?: ResourceType): Promise<ApiVersion[]>;
  getDeployments(apiId: string, resourceType?: ResourceType): Promise<ApiDeployment[]>;
  getDefinitions(apiId: string, version: string, resourceType?: ResourceType): Promise<ApiDefinition[]>;
  getDefinition(definitionId: ApiDefinitionId): Promise<ApiDefinition>;
  getSpecificationLink(definitionId: ApiDefinitionId): Promise<string>;
  getSpecification(definitionId: ApiDefinitionId): Promise<string | undefined>;
  getEnvironment(environmentId: string): Promise<ApiEnvironment>;
  getSecurityRequirements(definitionId: ApiDefinitionId): Promise<ApiAuthSchemeMetadata[]>;
  getSecurityCredentials(definitionId: ApiDefinitionId, schemeName: string): Promise<ApiAuthScheme>;
  getMetadataSchemas(): Promise<MetadataSchema[]>;
  getPlugin(name: string): Promise<PluginDetails>;
  getSkillEvaluationResult(skillName: string): Promise<SkillEvaluationResult | undefined>;
}
