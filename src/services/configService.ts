/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Settings } from "../contracts/settings";
import { IConfigService } from "./IConfigService";

/**
 * Default configuration service that loads the settings from the config.json file.
 */
export class ConfigService implements IConfigService {
    private settingsPromise?: Promise<Settings>;

    private async loadFromFile(): Promise<Settings> {
        const response = await fetch("/config.json");
        const dataJson = await response.json();

        return dataJson;
    }

    public getSettings(): Promise<Settings> {
        if (this.settingsPromise) {
            return this.settingsPromise;
        }

        this.settingsPromise = this.loadFromFile();
        return this.settingsPromise;
    }
}
