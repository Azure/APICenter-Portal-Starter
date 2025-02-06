import * as msal from '@azure/msal-browser';
import config from '@/config';

let msalInstance: msal.PublicClientApplication | undefined;

const scopes =
  typeof config.authentication.scopes === 'string' ? [config.authentication.scopes] : config.authentication.scopes;

async function getMsalInstance(): Promise<msal.PublicClientApplication> {
  if (msalInstance) {
    return msalInstance;
  }

  const authorityUrl =
    (config.authentication.authority || config.authentication.azureAdInstance) + config.authentication.tenantId;

  const msalConfig: msal.Configuration = {
    auth: {
      clientId: config.authentication.clientId,
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
    const msalInstance = await getMsalInstance();
    const accounts = msalInstance.getAllAccounts();

    return accounts.length > 0;
  },

  async getAccessToken(): Promise<string> {
    const msalInstance = await getMsalInstance();
    const authResult = await msalInstance.acquireTokenSilent({ scopes });

    return authResult.accessToken;
  },

  async signIn(): Promise<void> {
    const msalInstance = await getMsalInstance();
    const authResult = await msalInstance.loginPopup({ scopes });

    msalInstance.setActiveAccount(authResult.account);
  },

  async signOut(): Promise<void> {
    const msalInstance = await getMsalInstance();
    await msalInstance.logoutPopup();
  },
};

export default MsalAuthService;
