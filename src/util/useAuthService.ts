import { IAuthService } from '../services/IAuthService';
import { MsalAuthService } from '../services/msalAuthService';
import { useConfigService } from './useConfigService';

const configService = useConfigService();
const authService = new MsalAuthService(configService);

export const useAuthService = (): IAuthService => {
  return authService;
};
