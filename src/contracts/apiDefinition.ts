/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Specification } from "./specification";

/**
 * The API definition contract.
 */
export interface ApiDefinition {
    /**
     * The name of the API definition, e.g., "default".
     */
    name: string;

    /**
     * The title of the API definition, e.g., "Default".
     */
    title: string;

    /**
     * The API definition description.
     */
    description?: string;

    /**
     * The API specification information.
     */
    specification: Specification;
}
