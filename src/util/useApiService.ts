import { groupBy } from 'lodash';
import { ApiDefinition } from '../types/apiDefinition';
import { Method } from '../services/IHttpClient';
import { ActiveFilterData } from '@/types/apiFilters';
import { useHttpClient } from './useHttpClient';

export class ApiService {
  constructor(private httpClient: any) {}

  public async getApis(search: string, filters: ActiveFilterData[] = []): Promise<any> {
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

    return await this.httpClient(`apis?${searchParams.toString()}`);
  }

  public async getApi(id: string) {
    return await this.httpClient(`apis/${id}`);
  }

  public async getVersions(apiId: string) {
    return await this.httpClient(`apis/${apiId}/versions`);
  }

  public async getDeployments(apiId: string) {
    return await this.httpClient(`apis/${apiId}/deployments`);
  }

  public async getDefinitions(apiId: string, version: string) {
    return await this.httpClient(`apis/${apiId}/versions/${version}/definitions`);
  }

  public async getDefinition(apiName: string, versionName: string, definitionName: string): Promise<ApiDefinition> {
    return await this.httpClient(`apis/${apiName}/versions/${versionName}/definitions/${definitionName}`);
  }

  public async getSpecificationLink(apiName: string, versionName: string, definitionName: string) {
    const response = await this.httpClient(
      `apis/${apiName}/versions/${versionName}/definitions/${definitionName}:exportSpecification`,
      Method.POST
    );
    return response?.value;
  }

  public async getEnvironment(environmentId: string) {
    return await this.httpClient(`environments/${environmentId}`);
  }
}

const httpClient = useHttpClient();
const apiService = new ApiService(httpClient);

export const useApiService = () => apiService;
