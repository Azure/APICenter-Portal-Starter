import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const initialize = vi.fn(() => Promise.resolve());
  const getAllAccounts = vi.fn(() => []);
  const loginPopup = vi.fn();
  const setActiveAccount = vi.fn();
  const PublicClientApplication = vi.fn(function PublicClientApplication() {
    return {
      initialize,
      getAllAccounts,
      loginPopup,
      setActiveAccount,
    };
  });

  return {
    getRecoil: vi.fn(),
    getMsalClient: vi.fn(),
    initialize,
    getAllAccounts,
    loginPopup,
    setActiveAccount,
    PublicClientApplication,
  };
});

vi.mock('recoil-nexus', () => ({ getRecoil: mocks.getRecoil }));
vi.mock('@/services/MsalClient', () => ({ getMsalClient: mocks.getMsalClient }));
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

describe('MsalAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRecoil.mockReturnValueOnce(false).mockReturnValueOnce({ authentication });
    mocks.getMsalClient.mockResolvedValue({
      loginPopup: mocks.loginPopup,
      setActiveAccount: mocks.setActiveAccount,
    });
  });

  it('activates the account returned by popup sign-in', async () => {
    const account = { homeAccountId: 'home-account' };
    mocks.loginPopup.mockResolvedValue({ account });

    const { MsalAuthService } = await import('./MsalAuthService');

    await MsalAuthService.signIn();

    expect(mocks.getMsalClient).toHaveBeenCalledWith(authentication);
    expect(mocks.loginPopup).toHaveBeenCalledWith({ scopes: ['scope'] });
    expect(mocks.setActiveAccount).toHaveBeenCalledWith(account);
  });
});
