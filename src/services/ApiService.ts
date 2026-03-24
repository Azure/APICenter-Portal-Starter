import { groupBy } from 'lodash';
import memoize from 'memoizee';
import { HttpService } from '@/services/HttpService';
import { ApiMetadata } from '@/types/api';
import { ApiAuthScheme, ApiAuthSchemeMetadata } from '@/types/apiAuth';
import { ApiDefinition, ApiDefinitionId, ResourceType } from '@/types/apiDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import { ApiEnvironment } from '@/types/apiEnvironment';
import { ActiveFilterData } from '@/types/apiFilters';
import { ApiVersion } from '@/types/apiVersion';
import { IApiService, PaginatedResult } from '@/types/services/IApiService';
import { Server, ServerResponse } from '@/types/server';
import { MetadataSchema } from '@/types/metadataSchema';
import { PluginDetails } from '@/types/plugin';
import { DEFAULT_PAGE_SIZE } from '@/constants';

export const ApiService: IApiService = {
  async getApis(search: string, filters: ActiveFilterData[] = [], isSemanticSearch?: boolean): Promise<PaginatedResult<ApiMetadata>> {
    const searchParams = new URLSearchParams();
    searchParams.set('$top', String(DEFAULT_PAGE_SIZE));
    if (search.length && !isSemanticSearch) {
      searchParams.set('$search', search);
    }

    if (filters.length) {
      const filtersByType = groupBy(filters, 'type');
      const filtersString = Object.values(filtersByType)
        .map((filters) => {
          const filtersSet = filters.map((filter) => {
            if (filter.operator === 'contains') {
              return `contains(${filter.type}, '${filter.value}')`;
            }
            return `${filter.type} eq '${filter.value}'`;
          });
          return `(${filtersSet.join(' or ')})`;
        })
        .join(' and ');

      searchParams.set('$filter', filtersString);
    }

    if (search.length && isSemanticSearch) {
      const response = await HttpService.post<{ value: ApiMetadata[]; nextLink?: string }>(`:search?${searchParams.toString()}`, {
        query: search,
        searchType: 'vector',
      });
      return { value: response.value || [], nextLink: response.nextLink };
    }

    const response = await HttpService.get<{ value: ApiMetadata[]; nextLink?: string }>(`/apis?${searchParams.toString()}`);
    return { value: response.value || [], nextLink: response.nextLink };
  },

  async getApisByNextLink(nextLink: string): Promise<PaginatedResult<ApiMetadata>> {
    const response = await HttpService.getByUrl<{ value: ApiMetadata[]; nextLink?: string }>(nextLink);
    return { value: response.value || [], nextLink: response.nextLink };
  },

  async getApi(name: string, resourceType: ResourceType = 'apis'): Promise<ApiMetadata> {
    return await HttpService.get<ApiMetadata>(`/${resourceType}/${name}`);
  },

  async getServer(name: string): Promise<Server | undefined> {
    const response = await HttpService.get<ServerResponse>(`/v0/servers/${name}`);
    return response?.server;
  },

  async getVersions(apiName: string, resourceType: ResourceType = 'apis'): Promise<ApiVersion[]> {
    const response = await HttpService.get<{ value: ApiVersion[] }>(`/${resourceType}/${apiName}/versions?$top=${DEFAULT_PAGE_SIZE}`);
    return response.value || [];
  },

  async getDeployments(apiName: string, resourceType: ResourceType = 'apis'): Promise<ApiDeployment[]> {
    const response = await HttpService.get<{ value: ApiDeployment[] }>(`/${resourceType}/${apiName}/deployments?$top=${DEFAULT_PAGE_SIZE}`);
    return response.value || [];
  },

  async getDefinitions(apiName: string, version: string, resourceType: ResourceType = 'apis'): Promise<ApiDefinition[]> {
    const response = await HttpService.get<{ value: ApiDefinition[] }>(
      `/${resourceType}/${apiName}/versions/${version}/definitions?$top=${DEFAULT_PAGE_SIZE}`
    );
    return response.value || [];
  },

  async getDefinition({ apiName, versionName, definitionName, resourceType = 'apis' }: ApiDefinitionId): Promise<ApiDefinition> {
    return await HttpService.get<ApiDefinition>(
      `/${resourceType}/${apiName}/versions/${versionName}/definitions/${definitionName}`
    );
  },

  async getSpecificationLink({ apiName, versionName, definitionName, resourceType = 'apis' }: ApiDefinitionId): Promise<string> {
    const response = await HttpService.post<{ value: string }>(
      `/${resourceType}/${apiName}/versions/${versionName}/definitions/${definitionName}:exportSpecification`
    );
    return response?.value;
  },

  getSpecification: memoize(async (definitionId: ApiDefinitionId): Promise<string | undefined> => {
    const specificationLink = await ApiService.getSpecificationLink(definitionId);

    if (!specificationLink) {
      return undefined;
    }

    const res = await fetch(specificationLink);
    return res.text();
  }),

  async getEnvironment(environmentId: string): Promise<ApiEnvironment> {
    return await HttpService.get<ApiEnvironment>(`/environments/${environmentId}`);
  },

  async getSecurityRequirements(definitionId: ApiDefinitionId): Promise<ApiAuthSchemeMetadata[]> {
    const resourceType = definitionId.resourceType || 'apis';
    const response = await HttpService.get<{ value: ApiAuthSchemeMetadata[] }>(
      `/${resourceType}/${definitionId.apiName}/versions/${definitionId.versionName}/securityRequirements?$top=${DEFAULT_PAGE_SIZE}`
    );

    return response?.value || [];
  },

  async getSecurityCredentials(definitionId: ApiDefinitionId, schemeName: string): Promise<ApiAuthScheme> {
    const resourceType = definitionId.resourceType || 'apis';
    return await HttpService.post<ApiAuthScheme>(
      `/${resourceType}/${definitionId.apiName}/versions/${definitionId.versionName}/securityRequirements/${schemeName}:getCredentials`
    );
  },

  async getPlugin(name: string): Promise<PluginDetails> {
    return await HttpService.get<PluginDetails>(`/plugins/${name}`);
  },

  async getMetadataSchemas(): Promise<MetadataSchema[]> {
    const response = await HttpService.get<MetadataSchema[]>(`/metadataSchemas?$top=${DEFAULT_PAGE_SIZE}`, { skipWorkspacePrefix: true });
    return response || [];
  },
};
