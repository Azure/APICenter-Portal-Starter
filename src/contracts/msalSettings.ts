/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * The MSAL settings contract.
 */
export interface MsalSettings {
    /**
     * The client ID of the application registered in Azure AD.
     */
    clientId: string;

    /**
     * The tenant ID of the Azure AD tenant.
     */
    tenantId: string;

    /**
     * The scopes to request, e.g., ["user.read"].
     */
    scopes: string[];

    /**
     * Azure AD instance, e.g., https://login.microsoftonline.com/.
     */
    authority: string;
}
