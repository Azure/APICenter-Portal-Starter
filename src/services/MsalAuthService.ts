import * as msal from '@azure/msal-browser';
import { MsalSettings } from '@/types/msalSettings';
import { getRecoil } from 'recoil-nexus';
import appServicesAtom from '@/atoms/appServicesAtom';

let msalInstance: msal.PublicClientApplication | undefined;


async function getMsalInstance(config: MsalSettings): Promise<msal.PublicClientApplication> {
  if (msalInstance) {
    return msalInstance;
  }

  // Fixing authority for backward compatibility
  const authorityUrl =
    (config.authority || config.azureAdInstance) + config.tenantId;

  const msalConfig: msal.Configuration = {
    auth: {
      clientId: config.clientId,
      authority: authorityUrl
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

async function getAuthConfig(): Promise<MsalSettings> {
  const { ConfigService } = getRecoil(appServicesAtom);
  const config = await ConfigService.getSettings();

  // Fixing scopes for backward compatibility
  config.authentication.scopes = typeof config.authentication.scopes === 'string' ? [config.authentication.scopes] : config.authentication.scopes;

  return config.authentication;
}

const MsalAuthService = {
  async isAuthenticated(): Promise<boolean> {
    const config = await getAuthConfig();
    const msalInstance = await getMsalInstance(config);
    const accounts = msalInstance.getAllAccounts();

    return accounts.length > 0;
  },

  async getAccessToken(): Promise<string> {
    const config = await getAuthConfig();
    const msalInstance = await getMsalInstance(config);
    const authResult = await msalInstance.acquireTokenSilent({ scopes: config.scopes });

    return authResult.accessToken;
  },

  async signIn(): Promise<void> {
    const config = await getAuthConfig();
    const msalInstance = await getMsalInstance(config);
    const authResult = await msalInstance.loginPopup({ scopes: config.scopes });

    msalInstance.setActiveAccount(authResult.account);
  },

  async signOut(): Promise<void> {
    const config = await getAuthConfig();
    const msalInstance = await getMsalInstance(config);
    await msalInstance.logoutPopup();
  },
};

export default MsalAuthService;
