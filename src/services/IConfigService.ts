import { AppConfig } from '../types/appConfig';

/**
 * Configuration service.
 */
export interface IConfigService {
  /**
   * Get the application settings.
   */
  getSettings(): Promise<AppConfig>;
}
