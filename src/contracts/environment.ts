/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EnvironmentServer } from "./environmentServer";
import { EnvironmentOnboarding } from "./environmentOnboarding";

/**
 * The environment contract.
 */
export interface Environment {
    /**
     * The name of the environment, e.g., "api-management".
     */
    name: string;

    /**
     * The title of the environment, e.g., "API management".
     */
    title: string;

    /**
     * The kind of the deployment environment, e.g., "Production".
     */
    kind: string;

    /**
     * The description of the environment.
     */
    description?: string;

    /**
     * The server information of the environment.
     */
    server?: EnvironmentServer;

    /**
     * The onboarding information of the environment.
     */
    onboarding?: EnvironmentOnboarding;

    /**
     * Custom properties of the environment.
     */
    customProperties?: unknown;
}
