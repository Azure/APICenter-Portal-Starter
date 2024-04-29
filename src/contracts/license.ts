/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * API license contract.
 */
export interface License {
    /**
     * The name of the license, e.g., "MIT".
     */
    name: string;

    /**
     * URL pointing to the license details, e.g., "https://contoso.com/license". The URL field is mutually exclusive of the identifier field.
     */
    url: string;

    /**
     * SPDX license information for the API. The identifier field is mutually exclusive of the URL field.
     */
    identifier: string;
}
