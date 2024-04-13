/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Settings } from "../contracts/settings";

/**
 * Configuration service.
 */
export interface IConfigService {
    /**
     * Get the application settings.
     */
    getSettings(): Promise<Settings>;
}
