/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ApiDefinition } from "../contracts/apiDefinition";
import { Method } from "../services/IHttpClient";
import { useHttpClient } from "./useHttpClient";


export class ApiService {
    private requestCache: Map<string, Promise<any>> = new Map<string, Promise<any>>();

    constructor(private httpClient: any) { }

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

    public async getDefinition(apiName: string, versionName: string, definitionName: string): Promise<ApiDefinition> {
        return await this.httpClient(`apis/${apiName}/versions/${versionName}/definitions/${definitionName}`);
    }

    public async getSpecificationLink(apiName: string, versionName: string, definitionName: string): Promise<string> {
        const url = `apis/${apiName}/versions/${versionName}/definitions/${definitionName}:exportSpecification`;

        if (this.requestCache.has(url)) {
            return this.requestCache.get(url)!; // Non-null assertion (!) since we know it exists
        }

        const responsePromise =  this.httpClient(url, Method.POST)
            .then(response => response.value)
            .catch(error => {
                this.requestCache.delete(url);
                return Promise.reject(error);
            });
            
        this.requestCache.set(url, responsePromise);

        return responsePromise;
    }

    public async getEnvironment(environmentId: string) {
        return await this.httpClient(`environments/${environmentId}`);
    }
}

const httpClient = useHttpClient();
const apiService = new ApiService(httpClient);

export const useApiService = () => apiService;
