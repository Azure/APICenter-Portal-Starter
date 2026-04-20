import { MsalSettings } from './msalSettings';

export enum AppCapabilities {
  SEMANTIC_SEARCH = 'semanticSearch',
  CONTRIBUTIONS = 'contributions',
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
   * MCP-specific settings.
   */
  mcp?: {
    /** Whether to use the CORS proxy for MCP server calls. Defaults to false. */
    useCorsProxy?: boolean;
  };

  /**
   * The scoping filter. If provided, only APIs with the specified metadata properties will be shown.
   */
  scopingFilter: string;

  /**
   * The capabilities supported by the service, depending on SKU and other parameters.
   */
  capabilities: AppCapabilities[];

  /**
   * The contributions settings for the portal.
   */
  contributions?: {
    enabled: boolean;
    gitRepositoryUrl: string;
  };
}
