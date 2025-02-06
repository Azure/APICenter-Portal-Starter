import { groupBy } from 'lodash';
import memoize from 'memoizee';
import { ActiveFilterData } from '@/types/apiFilters';
import HttpService from '@/services/HttpService';
import { ApiMetadata } from '@/types/api';
import { ApiDefinition, ApiDefinitionId } from '@/types/apiDefinition';
import { ApiVersion } from '@/types/apiVersion';
import { ApiDeployment } from '@/types/apiDeployment';
import { ApiEnvironment } from '@/types/apiEnvironment';
import { IApiService } from '@/types/services/IApiService';

const ApiService: IApiService = {
  async getApis(search: string, filters: ActiveFilterData[] = []): Promise<ApiMetadata[]> {
    const searchParams = new URLSearchParams();
    if (search.length) {
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

    const response = await HttpService.get<{ value: ApiMetadata[] }>(`/apis?${searchParams.toString()}`);
    return response.value || [];
  },

  async getApi(id: string): Promise<ApiMetadata> {
    return await HttpService.get<ApiMetadata>(`/apis/${id}`);
  },

  async getVersions(apiId: string): Promise<ApiVersion[]> {
    const response = await HttpService.get<{ value: ApiVersion[] }>(`/apis/${apiId}/versions`);
    return response.value || [];
  },

  async getDeployments(apiId: string): Promise<ApiDeployment[]> {
    const response = await HttpService.get<{ value: ApiDeployment[] }>(`/apis/${apiId}/deployments`);
    return response.value || [];
  },

  async getDefinitions(apiId: string, version: string): Promise<ApiDefinition[]> {
    const response = await HttpService.get<{ value: ApiDefinition[] }>(
      `/apis/${apiId}/versions/${version}/definitions`
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
};

export default ApiService;
