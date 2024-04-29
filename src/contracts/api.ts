/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Bag } from "./bag";
import { Contact } from "./contact";
import { ExternalDocumentation } from "./externalDocumentation";
import { License } from "./license";
import { TermsOfService } from "./termsOfService";

/**
 * The API contract.
 */
export interface Api {
    /**
     * The name of the API, e.g., "echo-api".
     */
    name: string;

    /**
     * The title of the API, e.g., "Echo API".
     */
    title: string;

    /**
     * The kind of the API, e.g., "REST".
     */
    kind: string;

    /**
     * The description of the API.
     */
    description?: string;

    /**
     * The summary of the API.
     */
    summary?: string;

    /**
     * The lifecycle stage of the API, e.g., "development", "production", "retired".
     */
    lifecycleStage?: string;

    /**
     * The terms of service of the API.
     */
    termsOfService?: TermsOfService;

    /**
     * The license information.
     */
    license?: License;

    /**
     * The external documentation.
     */
    externalDocumentation?: ExternalDocumentation[];

    /**
     * The contact information.
     */
    contacts?: Contact[];

    /**
     * The custom properties of the API.s
     */
    customProperties?: Bag<unknown>;

    /**
     * The time stamp of latest update, e.g., "2024-01-01T00:00:00.000000Z".
     */
    lastUpdated: string;
}
