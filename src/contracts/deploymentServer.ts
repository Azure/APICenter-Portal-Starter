/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * The deployment server contract.
 */
export interface DeploymentServer {
    /**
     * The UTI of the deployment server, e.g., "https://contoso.azure-api.net".
     */
    runtimeUri: string;
}
