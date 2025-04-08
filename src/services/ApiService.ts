import { groupBy } from 'lodash';
import memoize from 'memoizee';
import { getRecoil } from 'recoil-nexus';
import appServicesAtom from '@/atoms/appServicesAtom';
import HttpService from '@/services/HttpService';
import { ApiMetadata } from '@/types/api';
import { ApiAuthScheme, ApiAuthSchemeMetadata } from '@/types/apiAuth';
import { ApiDefinition, ApiDefinitionId } from '@/types/apiDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import { ApiEnvironment } from '@/types/apiEnvironment';
import { ActiveFilterData } from '@/types/apiFilters';
import { ApiVersion } from '@/types/apiVersion';
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

    const { ConfigService } = getRecoil(appServicesAtom);
    const settings = await ConfigService.getSettings();
    const isSemanticSearchAvailable = settings.capabilities?.includes('semanticSearch') || false;

    let response;

    if (search.length && isSemanticSearchAvailable) {
      response = await HttpService.post<{ value: ApiMetadata[] }>(`:search?${searchParams.toString()}`, {
        query: search,
        searchType: 'vector',
      });
    } else {
      response = await HttpService.get<{ value: ApiMetadata[] }>(`/apis?${searchParams.toString()}`);
    }

    return response.value || [];
  },

  async getApi(name: string): Promise<ApiMetadata> {
    return await HttpService.get<ApiMetadata>(`/apis/${name}`);
  },

  async getVersions(apiName: string): Promise<ApiVersion[]> {
    const response = await HttpService.get<{ value: ApiVersion[] }>(`/apis/${apiName}/versions`);
    return response.value || [];
  },

  async getDeployments(apiName: string): Promise<ApiDeployment[]> {
    const response = await HttpService.get<{ value: ApiDeployment[] }>(`/apis/${apiName}/deployments`);
    return response.value || [];
  },

  async getDefinitions(apiName: string, version: string): Promise<ApiDefinition[]> {
    const response = await HttpService.get<{ value: ApiDefinition[] }>(
      `/apis/${apiName}/versions/${version}/definitions`
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
      `/apis/${definitionId.apiName}/versions/${definitionId.versionName}/securityRequirements`
    );

    return response?.value;
  },

  async getSecurityCredentials(definitionId: ApiDefinitionId, schemeName: string): Promise<ApiAuthScheme> {
    return await HttpService.post<ApiAuthScheme>(
      `/apis/${definitionId.apiName}/versions/${definitionId.versionName}/securityRequirements/${schemeName}:getCredentials`
    );
  },
};

export default ApiService;
