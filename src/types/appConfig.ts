export interface MsalSettings {
  /** The client ID of the application registered in Azure AD. */
  clientId: string;
  /** The tenant ID of the Azure AD tenant. */
  tenantId: string;
  /** The scopes to request, e.g., ["user.read"]. */
  scopes: string[];
  /** Azure AD instance, e.g., https://login.microsoftonline.com/. */
  authority: string;
}

export interface AppConfig {
  /** Data API hostname, e.g. https://contoso.data.centraluseuap.azure-apicenter.ms. */
  dataApiHostName: string;
  /** The API portal title. */
  title: string;
  /** The authentication settings. */
  authentication: MsalSettings;
  /** The scoping filter. If provided, only APIs with the specified metadata properties will be shown. */
  scopingFilter: string;
}
