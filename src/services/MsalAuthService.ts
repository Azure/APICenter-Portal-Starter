import { getRecoil } from 'recoil-nexus';
import { configAtom } from '@/atoms/configAtom';
import { isAnonymousAccessEnabledAtom } from '@/atoms/isAnonymousAccessEnabledAtom';
import { getMsalClient } from '@/services/MsalClient';
import { MsalSettings } from '@/types/msalSettings';

function getAuthConfig(): MsalSettings {
  const { authentication } = getRecoil(configAtom);

  if (!authentication) {
    throw new Error('Authentication configuration is not available. Use AnonymousAuthService instead.');
  }

  return {
    ...authentication,
    scopes: [authentication.scopes].flat(),
  };
}

export const MsalAuthService = {
  async isAuthenticated(): Promise<boolean> {
    if (getRecoil(isAnonymousAccessEnabledAtom)) {
      return true;
    }

    const config = getAuthConfig();
    const msalInstance = await getMsalClient(config);
    const accounts = msalInstance.getAllAccounts();

    return accounts.length > 0;
  },

  async getAccessToken(): Promise<string> {
    if (getRecoil(isAnonymousAccessEnabledAtom)) {
      return '';
    }

    const config = getAuthConfig();
    const msalInstance = await getMsalClient(config);
    const authResult = await msalInstance.acquireTokenSilent({ scopes: config.scopes });

    return authResult.accessToken;
  },

  async signIn(): Promise<void> {
    if (getRecoil(isAnonymousAccessEnabledAtom)) {
      return;
    }

    const config = getAuthConfig();
    const msalInstance = await getMsalClient(config);
    const authResult = await msalInstance.loginPopup({ scopes: config.scopes });

    msalInstance.setActiveAccount(authResult.account);
  },

  async signOut(): Promise<void> {
    if (getRecoil(isAnonymousAccessEnabledAtom)) {
      return;
    }

    const config = getAuthConfig();
    const msalInstance = await getMsalClient(config);
    await msalInstance.logoutPopup();
  },
};
