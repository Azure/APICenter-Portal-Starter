/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * The contact information contract.
 */
export type Contact = {
    /**
     * The name of the contact, e.g., "Contoso Support".
     */
    name: string;

    /**
     * The URL pointing to the contact information, e.g., "https://contoso.com/support".
     */
    url: string;

    /**
     * The email address of the contact, e.g., support@contoso.com"
     */
    email: string;
};
