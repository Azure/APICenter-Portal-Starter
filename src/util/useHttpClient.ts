import { HttpClient } from '../services/httpClient';
import { useAuthService } from './useAuthService';
import { useConfigService } from './useConfigService';

export const authService = useAuthService();
export const configService = useConfigService();

const httpClient = new HttpClient();

export const useHttpClient = () => {
  return httpClient.fetchData;
};
