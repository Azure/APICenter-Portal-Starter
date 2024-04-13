/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export enum Method {
    GET = "GET",
    POST = "POST",
}
export interface IHttpClient {
    fetchData(url: string, method: Method): Promise<any>;
}
