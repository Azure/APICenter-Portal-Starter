/**
 * The MSAL settings contract.
 */
export interface MsalSettings {
  /**
   * The client ID of the application registered in Azure AD.
   */
  clientId: string;

  /**
   * The tenant ID of the Azure AD tenant.
   */
  tenantId: string;

  /**
   * The scopes to request, e.g., ["user.read"].
   */
  scopes: string[];

  /**
   * Azure AD instance, e.g., https://login.microsoftonline.com/.
   */
  authority: string;

  /**
   * @deprecated Use "authority" instead.
   */
  azureAdInstance: string;
}
