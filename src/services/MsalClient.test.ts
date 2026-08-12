import { beforeEach, describe, expect, it, vi } from 'vitest';

interface MockPublicClientApplicationConfig {
  auth: {
    clientId: string;
    authority: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
  };
}

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
        postLogoutRedirectUri: 'http://localhost:3000/entraid-redirect.html',
      },
    });
  });

  it('configures the same dedicated bridge URI for redirect and post-logout redirect', async () => {
    const { getMsalClient } = await import('./MsalClient');

    await getMsalClient(authentication);

    const [config] = mocks.PublicClientApplication.mock.calls[0] as unknown as [MockPublicClientApplicationConfig];
    expect(config.auth.redirectUri).toBe('http://localhost:3000/entraid-redirect.html');
    expect(config.auth.postLogoutRedirectUri).toBe('http://localhost:3000/entraid-redirect.html');
    expect(config.auth.redirectUri).toBe(config.auth.postLogoutRedirectUri);
  });

  it('propagates the first initialization rejection and retries with a fresh client on the next call', async () => {
    const initError = new Error('init failed');
    mocks.initialize.mockRejectedValueOnce(initError);

    const { getMsalClient } = await import('./MsalClient');

    await expect(getMsalClient(authentication)).rejects.toThrow(initError);

    const second = await getMsalClient(authentication);

    expect(second).toBeDefined();
    expect(mocks.PublicClientApplication).toHaveBeenCalledTimes(2);
    expect(mocks.initialize).toHaveBeenCalledTimes(2);
  });
});
