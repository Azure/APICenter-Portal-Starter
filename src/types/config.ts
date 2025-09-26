import { MsalSettings } from './msalSettings';

export enum AppCapabilities {
  SEMANTIC_SEARCH = 'semanticSearch',
}

/**
 * The application settings contract.
 */
export interface Config {
  /**
   * Data API hostname, e.g. https://contoso.data.centraluseuap.azure-apicenter.ms.
   */
  dataApiHostName: string;

  /**
   * The API portal title.
   */
  title: string;

  /**
   * The authentication settings. If not provided, anonymous access is enabled.
   */
  authentication?: MsalSettings;

  /**
   * The scoping filter. If provided, only APIs with the specified metadata properties will be shown.
   */
  scopingFilter: string;

  /**
   * The capabilities supported by the service, depending on SKU and other parameters.
   */
  capabilities: AppCapabilities[];
}
