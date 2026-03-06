import { groupBy } from 'lodash';
import memoize from 'memoizee';
import { HttpService } from '@/services/HttpService';
import { ApiMetadata } from '@/types/api';
import { ApiAuthScheme, ApiAuthSchemeMetadata } from '@/types/apiAuth';
import { ApiDefinition, ApiDefinitionId } from '@/types/apiDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import { ApiEnvironment } from '@/types/apiEnvironment';
import { ActiveFilterData } from '@/types/apiFilters';
import { ApiVersion } from '@/types/apiVersion';
import { IApiService, PaginatedResult } from '@/types/services/IApiService';
import { Server, ServerResponse } from '@/types/server';
import { MetadataSchema } from '@/types/metadataSchema';
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
          const filtersSet = filters.map((filter) => `${filter.type} eq '${filter.value}'`);
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

  async getApi(name: string): Promise<ApiMetadata> {
    return await HttpService.get<ApiMetadata>(`/apis/${name}`);
  },

  async getServer(name: string): Promise<Server | undefined> {
    const response = await HttpService.get<ServerResponse>(`/v0/servers/${name}`);
    return response?.server;
  },

  async getVersions(apiName: string): Promise<ApiVersion[]> {
    const response = await HttpService.get<{ value: ApiVersion[] }>(`/apis/${apiName}/versions?$top=${DEFAULT_PAGE_SIZE}`);
    return response.value || [];
  },

  async getDeployments(apiName: string): Promise<ApiDeployment[]> {
    const response = await HttpService.get<{ value: ApiDeployment[] }>(`/apis/${apiName}/deployments?$top=${DEFAULT_PAGE_SIZE}`);
    return response.value || [];
  },

  async getDefinitions(apiName: string, version: string): Promise<ApiDefinition[]> {
    const response = await HttpService.get<{ value: ApiDefinition[] }>(
      `/apis/${apiName}/versions/${version}/definitions?$top=${DEFAULT_PAGE_SIZE}`
    );
    return response.value || [];
  },

  async getDefinition({ apiName, versionName, definitionName }: ApiDefinitionId): Promise<ApiDefinition> {
    return await HttpService.get<ApiDefinition>(
      `/apis/${apiName}/versions/${versionName}/definitions/${definitionName}`
    );
  },

  async getSpecificationLink({ apiName, versionName, definitionName }: ApiDefinitionId): Promise<string> {
    const response = await HttpService.post<{ value: string }>(
      `/apis/${apiName}/versions/${versionName}/definitions/${definitionName}:exportSpecification`
    );
    return response?.value;
  },

  getSpecification: memoize(async (definitionId: ApiDefinitionId): Promise<string | undefined> => {
    const res = await fetch(await ApiService.getSpecificationLink(definitionId));
    return res.text();
  }),

  async getEnvironment(environmentId: string): Promise<ApiEnvironment> {
    return await HttpService.get<ApiEnvironment>(`/environments/${environmentId}`);
  },

  async getSecurityRequirements(definitionId: ApiDefinitionId): Promise<ApiAuthSchemeMetadata[]> {
    const response = await HttpService.get<{ value: ApiAuthSchemeMetadata[] }>(
      `/apis/${definitionId.apiName}/versions/${definitionId.versionName}/securityRequirements?$top=${DEFAULT_PAGE_SIZE}`
    );

    return response?.value || [];
  },

  async getSecurityCredentials(definitionId: ApiDefinitionId, schemeName: string): Promise<ApiAuthScheme> {
    return await HttpService.post<ApiAuthScheme>(
      `/apis/${definitionId.apiName}/versions/${definitionId.versionName}/securityRequirements/${schemeName}:getCredentials`
    );
  },

  async getMetadataSchemas(): Promise<MetadataSchema[]> {
    const response = await HttpService.get<MetadataSchema[]>(`/metadataSchemas?$top=${DEFAULT_PAGE_SIZE}`, { skipWorkspacePrefix: true });
    return response || [];
  },
};
