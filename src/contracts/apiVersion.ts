/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * The API version contract
 */
export interface ApiVersion {
    /**
     * The version of the API, e.g., "v1".
     */
    name: string;

    /**
     * The title of the API version, e.g., "Version 1".
     */
    title: string;

    /**
     * The API lifecycle stage, e.g., "design".
     */
    lifecycleStage: string;
}
