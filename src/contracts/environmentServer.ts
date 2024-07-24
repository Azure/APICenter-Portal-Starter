/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * The environment server contract.
 */
export interface EnvironmentServer {
    /**
     * The type of the server that represents the environment.
     */
    type?: string;

    /**
     * The URIs of the server's management portal.
     */
    managementPortalUri?: string[];
}
