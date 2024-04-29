/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as msal from "@azure/msal-browser";

import { IAuthService } from "./IAuthService";
import { IConfigService } from "./IConfigService";

/**
 * Authentication sertvice based on MSAL.
 */
export class MsalAuthService implements IAuthService {
    private msalInstance?: msal.PublicClientApplication;
    private scopes?: string[];

    constructor(private readonly configService: IConfigService) {}

    private async getMsalInstance(): Promise<msal.PublicClientApplication> {
        if (this.msalInstance) {
            return this.msalInstance;
        }

        const settings = await this.configService.getSettings();
        const authorityUrl = settings.authentication.authority + settings.authentication.tenantId;

        const msalConfig: msal.Configuration = {
            auth: {
                clientId: settings.authentication.clientId,
                authority: authorityUrl,
            },
        };

        const msalInstance = new msal.PublicClientApplication(msalConfig);
        await msalInstance.initialize();

        this.msalInstance = msalInstance;
        this.scopes = settings.authentication.scopes;

        const accounts = msalInstance.getAllAccounts();

        if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
        }

        return msalInstance;
    }

    public async isAuthenticated(): Promise<boolean> {
        const msalInstance = await this.getMsalInstance();
        const accounts = msalInstance.getAllAccounts();

        return accounts.length > 0;
    }

    public async getAccessToken(): Promise<string> {
        const msalInstance = await this.getMsalInstance();
        const authResult = await msalInstance.acquireTokenSilent({ scopes: this.scopes! });

        return authResult.accessToken;
    }

    public async signIn(): Promise<void> {
        const msalInstance = await this.getMsalInstance();
        const authResult = await msalInstance.loginPopup({ scopes: this.scopes! });

        msalInstance.setActiveAccount(authResult.account);
    }

    public signOut(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
