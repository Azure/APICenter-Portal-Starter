import * as msal from '@azure/msal-browser';
import { getRecoil } from 'recoil-nexus';
import { MsalSettings } from '@/types/msalSettings';
import configAtom from '@/atoms/configAtom';
import isAnonymousAccessEnabledAtom from '@/atoms/isAnonymousAccessEnabledAtom';

let msalInstance: msal.PublicClientApplication | undefined;

function getAuthConfig(): MsalSettings {
  const { authentication } = getRecoil(configAtom);

  if (!authentication) {
    throw new Error('Authentication configuration is not available. Use AnonymousAuthService instead.');
  }

  return {
    ...authentication,
    // Fixing scopes for backward compatibility
    scopes: [authentication.scopes].flat(),
  };
}

async function getMsalInstance(config: MsalSettings): Promise<msal.PublicClientApplication> {
  if (msalInstance) {
    return msalInstance;
  }

  // Fixing authority for backward compatibility
  const authorityUrl = (config.authority || config.azureAdInstance) + config.tenantId;

  const msalConfig: msal.Configuration = {
    auth: {
      clientId: config.clientId,
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

const MsalAuthService = {
  async isAuthenticated(): Promise<boolean> {
    if (getRecoil(isAnonymousAccessEnabledAtom)) {
      return true;
    }

    const config = getAuthConfig();
    const msalInstance = await getMsalInstance(config);
    const accounts = msalInstance.getAllAccounts();

    return accounts.length > 0;
  },

  async getAccessToken(): Promise<string> {
    if (getRecoil(isAnonymousAccessEnabledAtom)) {
      return '';
    }

    const config = getAuthConfig();
    const msalInstance = await getMsalInstance(config);
    const authResult = await msalInstance.acquireTokenSilent({ scopes: config.scopes });

    return authResult.accessToken;
  },

  async signIn(): Promise<void> {
    if (getRecoil(isAnonymousAccessEnabledAtom)) {
      return;
    }

    const config = getAuthConfig();
    const msalInstance = await getMsalInstance(config);
    const authResult = await msalInstance.loginPopup({ scopes: config.scopes });

    msalInstance.setActiveAccount(authResult.account);
  },

  async signOut(): Promise<void> {
    if (getRecoil(isAnonymousAccessEnabledAtom)) {
      return;
    }

    const config = getAuthConfig();
    const msalInstance = await getMsalInstance(config);
    await msalInstance.logoutPopup();
  },
};

export default MsalAuthService;
