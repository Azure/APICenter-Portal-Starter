/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Method } from "../services/IHttpClient";
import { useHttpClient } from "./useHttpClient";

export class ApiService {
    constructor(private httpClient: any) {}

    public async getApis(queryString?: string): Promise<any> {
        return queryString ? await this.httpClient(`apis?${queryString}`) : await this.httpClient(`apis`);
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
