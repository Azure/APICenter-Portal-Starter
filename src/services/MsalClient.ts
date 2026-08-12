import * as msal from '@azure/msal-browser';
import { MsalSettings } from '@/types/msalSettings';

export const ENTRA_REDIRECT_PATH = '/entraid-redirect.html';

let msalInstancePromise: Promise<msal.PublicClientApplication> | undefined;

export function getEntraRedirectUri(origin?: string): string {
  const resolvedOrigin = origin ?? globalThis.location?.origin ?? 'http://localhost:3000';
  return new URL(ENTRA_REDIRECT_PATH, resolvedOrigin).href;
}

export function getMsalClient(authentication: MsalSettings): Promise<msal.PublicClientApplication> {
  if (!msalInstancePromise) {
    const authority = (authentication.authority || authentication.azureAdInstance) + authentication.tenantId;

    const instance = new msal.PublicClientApplication({
      auth: {
        clientId: authentication.clientId,
        authority,
        redirectUri: getEntraRedirectUri(),
      },
    });

    msalInstancePromise = instance.initialize().then(() => {
      const [account] = instance.getAllAccounts();
      if (account) {
        instance.setActiveAccount(account);
      }
      return instance;
    });
  }

  return msalInstancePromise;
}
