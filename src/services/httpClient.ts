/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { authService, configService } from "../util/useHttpClient";
import { IHttpClient, Method } from "./IHttpClient";

export class HttpClient implements IHttpClient {
    public async fetchData(url: string, method: Method = Method.GET): Promise<any> {
        const accessToken = await authService.getAccessToken();
        const settings = await configService.getSettings();
        const requestUrl = `https://${settings.dataApiHostName}/${url}`;

        const headers: HeadersInit = {
            Accept: "application/json",
            "Content-Type": "application/json",
        };

        if (accessToken) {
            headers.Authorization = "Bearer " + accessToken;
        }

        const response = await fetch(requestUrl, { method, headers });

        switch (response.status) {
            case 401:
            case 403:
                if (accessToken) {
                    localStorage.setItem("MS_APIC_DEVPORTAL_isRestricted", "true");
                    return null;
                }
                break;

            case 404:
                return null;
                
            default:
                break;
        }

        const dataJson = await response.json();
        return dataJson;
    }
}
