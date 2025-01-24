import { AppConfig } from '../types/appConfig';
import { IConfigService } from './IConfigService';

/**
 * Default configuration service that loads the settings from the config.json file.
 */
export class ConfigService implements IConfigService {
  private settingsPromise?: Promise<AppConfig>;

  private async loadFromFile(): Promise<AppConfig> {
    const response = await fetch('/config.json');
    const dataJson = await response.json();

    return dataJson;
  }

  public getSettings(): Promise<AppConfig> {
    if (this.settingsPromise) {
      return this.settingsPromise;
    }

    this.settingsPromise = this.loadFromFile();
    return this.settingsPromise;
  }
}
