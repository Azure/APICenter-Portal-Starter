import * as msal from '@azure/msal-browser';
import { getRecoil } from 'recoil-nexus';
import { configAtom } from '@/atoms/configAtom';
import { isAnonymousAccessEnabledAtom } from '@/atoms/isAnonymousAccessEnabledAtom';

let msalInstance: msal.PublicClientApplication | undefined;

async function getMsalInstance(): Promise<msal.PublicClientApplication | undefined> {
  if (msalInstance) {
    return msalInstance;
  }

  if (getRecoil(isAnonymousAccessEnabledAtom)) {
    return undefined;
  }

  const { authentication } = getRecoil(configAtom);
  if (!authentication) {
    return undefined;
  }

  const authorityUrl = (authentication.authority || authentication.azureAdInstance) + authentication.tenantId;

  const msalConfig: msal.Configuration = {
    auth: {
      clientId: authentication.clientId,
      authority: authorityUrl,
    },
  };

  msalInstance = new msal.PublicClientApplication(msalConfig);
  await msalInstance.initialize();

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  return msalInstance;
}

/**
 * Self-contained service for acquiring MSAL tokens for MCP servers
 * that use Entra ID authentication (no dynamic client registration).
 */
export const McpMsalAuthService = {
  /**
   * Try to acquire a token silently for the given scopes.
   * Supports per-request authority override for cross-tenant scenarios.
   * Returns the access token, or undefined if user interaction is required.
   * Throws on non-interactive errors (misconfiguration, wrong tenant, etc.).
   */
  async acquireToken(scopes: string[], authority?: string): Promise<string | undefined> {
    const instance = await getMsalInstance();
    if (!instance) {
      return undefined;
    }

    try {
      const result = await instance.acquireTokenSilent({ scopes, authority });
      return result.accessToken;
    } catch (err) {
      if (err instanceof msal.InteractionRequiredAuthError) {
        return undefined;
      }
      throw err;
    }
  },

  /**
   * Acquire a token via interactive popup.
   * Used when silent acquisition fails (consent required).
   * Supports per-request authority override for cross-tenant scenarios.
   * Sets the active account after successful authentication.
   */
  async acquireTokenInteractive(scopes: string[], authority?: string): Promise<string> {
    const instance = await getMsalInstance();
    if (!instance) {
      throw new Error(
        'MSAL is not available. The portal must be configured with Entra ID authentication to use this feature.'
      );
    }

    const result = await instance.acquireTokenPopup({ scopes, authority });
    if (result.account) {
      instance.setActiveAccount(result.account);
    }
    return result.accessToken;
  },

  /**
   * Check if MSAL is available (portal has Entra ID auth configured and user is not anonymous).
   */
  async isAvailable(): Promise<boolean> {
    const instance = await getMsalInstance();
    return instance !== undefined;
  },
};
