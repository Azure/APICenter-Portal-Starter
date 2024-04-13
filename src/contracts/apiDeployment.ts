/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DeploymentServer } from "./deploymentServer";

/**
 * The API deployment contract.
 */
export interface ApiDeployment {
    /**
     * The name of the API deployment, e.g., "production".
     */
    name: string;

    /**
     * The title of the API deployment, e.g., "Production deployment".
     */
    title: string;

    /**
     * The API deployment description.
     */
    description?: string;

    /**
     * Name of the environment, e.g., "public-cloud".
     */
    environment: string;

    /**
     * The deployment server information.
     */
    server: DeploymentServer;

    /**
     * Indicates whether the deployment is recommended.
     */
    recommended?: boolean;

    /**
     * Custom properties of the deployment
     */
    customProperties?: unknown;
}
