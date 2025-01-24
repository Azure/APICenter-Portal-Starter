import { ConfigService } from '../services/configService';
import { IConfigService } from '../services/IConfigService';

const configServcice = new ConfigService();

export const useConfigService = (): IConfigService => {
  return configServcice;
};
