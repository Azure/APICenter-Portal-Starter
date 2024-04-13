/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConfigService } from "../services/configService";
import { IConfigService } from "../services/IConfigService";

const configServcice = new ConfigService();

export const useConfigService = (): IConfigService => {
    return configServcice;
};
