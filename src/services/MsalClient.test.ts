import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const initialize = vi.fn(() => Promise.resolve());
  const getAllAccounts = vi.fn(() => []);
  const setActiveAccount = vi.fn();
  const PublicClientApplication = vi.fn(function PublicClientApplication() {
    return {
      initialize,
      getAllAccounts,
      setActiveAccount,
    };
  });

  return { initialize, getAllAccounts, setActiveAccount, PublicClientApplication };
});

vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: mocks.PublicClientApplication,
}));

const authentication = {
  clientId: 'client-id',
  tenantId: 'tenant-id',
  scopes: ['scope'],
  authority: 'https://login.microsoftonline.com/',
  azureAdInstance: '',
};

describe('MsalClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('uses the dedicated Entra redirect bridge URI', async () => {
    const { getEntraRedirectUri } = await import('./MsalClient');

    expect(getEntraRedirectUri('https://portal.example.test/apis/one')).toBe(
      'https://portal.example.test/entraid-redirect.html'
    );
  });

  it('initializes one client for concurrent callers', async () => {
    const { getMsalClient } = await import('./MsalClient');

    const [first, second] = await Promise.all([getMsalClient(authentication), getMsalClient(authentication)]);

    expect(first).toBe(second);
    expect(mocks.PublicClientApplication).toHaveBeenCalledTimes(1);
    expect(mocks.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.PublicClientApplication).toHaveBeenCalledWith({
      auth: {
        clientId: 'client-id',
        authority: 'https://login.microsoftonline.com/tenant-id',
        redirectUri: 'http://localhost:3000/entraid-redirect.html',
      },
    });
  });
});
