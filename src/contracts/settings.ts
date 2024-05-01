/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MsalSettings } from "./msalSettings";

/**
 * The application settings contract.
 */
export interface Settings {
    /**
     * Data API hostname, e.g. https://contoso.data.centraluseuap.azure-apicenter.ms.
     */
    dataApiHostName: string;

    /**
     * The API portal title.
     */
    title: string;

    /**
     * The authentication settings.
     */
    authentication: MsalSettings;
}
