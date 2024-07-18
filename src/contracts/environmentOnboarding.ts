/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * The environment onboarding contract.
 */
export interface EnvironmentOnboarding {
    /**
     * The instructions how to onboard to the environment.
     */
    instructions?: string;

    /**
     * The developer portal URIs of the environment.
     */
    developerPortalUri?: string[];
}
