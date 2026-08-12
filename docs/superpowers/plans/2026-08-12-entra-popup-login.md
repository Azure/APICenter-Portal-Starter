# Entra Popup Login Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore reliable Entra ID popup authentication with MSAL Browser v5 and its COOP-safe redirect bridge.

**Architecture:** A shared lazy singleton owns the `PublicClientApplication` used by portal and MCP authentication services. Both services use a fixed `/entraid-redirect.html` URI, while a dedicated Vite entry runs only MSAL's redirect bridge. The header catches interaction failures locally and blocks concurrent popup requests.

**Tech Stack:** React 18, TypeScript 5.7, Vite 6, Vitest 2, Fluent UI 9, Recoil, `@azure/msal-browser` 5.18.0, PowerShell/Bash provisioning hooks

## Global Constraints

- Preserve popup sign-in and popup sign-out.
- Name the bridge file exactly `entraid-redirect.html`.
- Use exactly one lazily initialized MSAL client for both portal and MCP authentication.
- The bridge page must not initialize React, routing, application services, or API requests.
- The bridge page must not be served with a `Cross-Origin-Opener-Policy` header.
- Preserve backward-compatible scope and authority normalization.
- Preserve root redirect URIs while adding bridge redirect URIs to app registrations.
- Do not expose tokens, account data, or personally identifying claims in logs.

---

## File Structure

- Create `src/services/MsalClient.ts`: shared MSAL configuration and singleton initialization.
- Create `src/services/MsalClient.test.ts`: redirect URI and singleton concurrency tests.
- Create `src/services/MsalAuthService.test.ts`: successful popup account activation test.
- Modify `src/services/MsalAuthService.ts`: consume the shared singleton.
- Modify `src/services/McpMsalAuthService.ts`: consume the same shared singleton.
- Create `entraid-redirect.html`: isolated MSAL v5 redirect bridge entry.
- Modify `vite.config.ts`: emit the main SPA and bridge pages.
- Modify `infra/hooks/postprovision.ps1`: register local and hosted bridge URIs.
- Modify `infra/hooks/postprovision.sh`: mirror the PowerShell registration behavior.
- Create `src/components/Header/AuthBtn/AuthBtn.test.tsx`: interaction failure and concurrency tests.
- Modify `src/components/Header/AuthBtn/AuthBtn.tsx`: local error state and pending-state guard.
- Modify `src/components/Header/AuthBtn/AuthBtn.module.scss`: compact header error layout.
- Modify `.wiki/authentication.md`: document singleton, popup bridge, and token flow.
- Modify `.wiki/configuration.md`: remove the nonexistent runtime `redirectUri` property.
- Modify `.wiki/deployment.md`: document the exact SPA redirect URI requirement.
- Modify `package.json` and `package-lock.json`: upgrade MSAL Browser to 5.18.0.

### Task 1: Shared MSAL v5 Client

**Files:**
- Create: `src/services/MsalClient.ts`
- Create: `src/services/MsalClient.test.ts`
- Create: `src/services/MsalAuthService.test.ts`
- Modify: `src/services/MsalAuthService.ts`
- Modify: `src/services/McpMsalAuthService.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `ENTRA_REDIRECT_PATH: '/entraid-redirect.html'`
- Produces: `getEntraRedirectUri(origin?: string): string`
- Produces: `getMsalClient(authentication: MsalSettings): Promise<msal.PublicClientApplication>`
- Consumes: `MsalSettings` from `src/types/msalSettings.ts`

- [ ] **Step 1: Install the pinned MSAL Browser release**

Run:

```powershell
npm install --save-exact @azure/msal-browser@5.18.0
```

Expected: `package.json` and `package-lock.json` resolve `@azure/msal-browser` to `5.18.0`.

- [ ] **Step 2: Write singleton and redirect URI tests**

Create `src/services/MsalClient.test.ts`:

```typescript
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

    const [first, second] = await Promise.all([
      getMsalClient(authentication),
      getMsalClient(authentication),
    ]);

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
```

- [ ] **Step 3: Run the test and confirm the missing module failure**

Run:

```powershell
npx vitest run src/services/MsalClient.test.ts
```

Expected: FAIL because `src/services/MsalClient.ts` does not exist.

- [ ] **Step 4: Implement the shared singleton**

Create `src/services/MsalClient.ts`:

```typescript
import * as msal from '@azure/msal-browser';
import { MsalSettings } from '@/types/msalSettings';

export const ENTRA_REDIRECT_PATH = '/entraid-redirect.html';

let msalInstancePromise: Promise<msal.PublicClientApplication> | undefined;

export function getEntraRedirectUri(origin = window.location.origin): string {
  return new URL(ENTRA_REDIRECT_PATH, origin).href;
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
```

- [ ] **Step 5: Make both authentication services consume the singleton**

In `src/services/MsalAuthService.ts`, remove its `msalInstance` variable and `getMsalInstance` function, import `getMsalClient`, and replace each call with:

```typescript
const msalInstance = await getMsalClient(config);
```

Keep `getAuthConfig`, scope normalization, popup login/logout, silent token acquisition, and active-account assignment unchanged.

In `src/services/McpMsalAuthService.ts`, remove its local `msalInstance` and initialization logic. Add:

```typescript
async function getConfiguredMsalClient(): Promise<msal.PublicClientApplication | undefined> {
  if (getRecoil(isAnonymousAccessEnabledAtom)) {
    return undefined;
  }

  const { authentication } = getRecoil(configAtom);
  return authentication ? getMsalClient(authentication) : undefined;
}
```

Replace its three `getMsalInstance()` calls with `getConfiguredMsalClient()`.

- [ ] **Step 6: Test successful popup account activation**

Create `src/services/MsalAuthService.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MsalAuthService } from './MsalAuthService';

const mocks = vi.hoisted(() => ({
  getRecoil: vi.fn(),
  getMsalClient: vi.fn(),
  loginPopup: vi.fn(),
  setActiveAccount: vi.fn(),
}));

vi.mock('recoil-nexus', () => ({ getRecoil: mocks.getRecoil }));
vi.mock('@/services/MsalClient', () => ({ getMsalClient: mocks.getMsalClient }));

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
    mocks.getRecoil
      .mockReturnValueOnce(false)
      .mockReturnValueOnce({ authentication });
    mocks.getMsalClient.mockResolvedValue({
      loginPopup: mocks.loginPopup,
      setActiveAccount: mocks.setActiveAccount,
    });
  });

  it('activates the account returned by popup sign-in', async () => {
    const account = { homeAccountId: 'home-account' };
    mocks.loginPopup.mockResolvedValue({ account });

    await MsalAuthService.signIn();

    expect(mocks.loginPopup).toHaveBeenCalledWith({ scopes: ['scope'] });
    expect(mocks.setActiveAccount).toHaveBeenCalledWith(account);
  });
});
```

- [ ] **Step 7: Run focused tests and type checking**

Run:

```powershell
npx vitest run src/services/MsalClient.test.ts src/services/MsalAuthService.test.ts
npx tsc --noEmit
```

Expected: all three authentication tests PASS and TypeScript exits with code 0.

- [ ] **Step 8: Commit the shared client**

```powershell
git add package.json package-lock.json src/services/MsalClient.ts src/services/MsalClient.test.ts src/services/MsalAuthService.ts src/services/MsalAuthService.test.ts src/services/McpMsalAuthService.ts
git commit -m "fix: share COOP-safe MSAL client" -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 2: Dedicated Redirect Bridge and Registration

**Files:**
- Create: `entraid-redirect.html`
- Modify: `vite.config.ts`
- Modify: `infra/hooks/postprovision.ps1`
- Modify: `infra/hooks/postprovision.sh`

**Interfaces:**
- Consumes: `ENTRA_REDIRECT_PATH` contract from Task 1
- Produces: production asset `/entraid-redirect.html`
- Produces: matching SPA redirect URIs in generated Entra app registrations

- [ ] **Step 1: Demonstrate that the bridge is not emitted**

Run:

```powershell
npm run build
if (Test-Path dist\entraid-redirect.html) { throw 'Unexpected bridge file before implementation' }
```

Expected: the build succeeds and the assertion confirms the bridge file is absent.

- [ ] **Step 2: Create the isolated redirect bridge page**

Create `entraid-redirect.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Completing sign in</title>
</head>
<body>
  <p>Completing sign in...</p>
  <script type="module">
    import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

    broadcastResponseToMainFrame().catch((error) => {
      console.error('Failed to return the authentication response to the portal.', error);
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: Configure Vite's two HTML entries**

Update `vite.config.ts` imports:

```typescript
import path from 'path';
import { fileURLToPath, URL } from 'node:url';
```

Extend the existing `build` block:

```typescript
rollupOptions: {
  input: {
    main: fileURLToPath(new URL('./index.html', import.meta.url)),
    entraidRedirect: fileURLToPath(new URL('./entraid-redirect.html', import.meta.url)),
  },
},
```

Keep the existing CSS minification setting.

- [ ] **Step 4: Register all exact bridge URIs in PowerShell provisioning**

Replace the `$spa` assignment in `infra/hooks/postprovision.ps1` with:

```powershell
$spa = @{
    redirectUris = @(
        "http://localhost:5173"
        "https://localhost:5173"
        "$env:AZURE_STATIC_APP_URL"
        "http://localhost:5173/entraid-redirect.html"
        "https://localhost:5173/entraid-redirect.html"
        "$env:AZURE_STATIC_APP_URL/entraid-redirect.html"
    )
}
```

- [ ] **Step 5: Mirror registration in Bash provisioning**

Replace the `spa` assignment in `infra/hooks/postprovision.sh` with:

```bash
spa="{\"redirectUris\": [\"http://localhost:5173\", \"https://localhost:5173\", \"$AZURE_STATIC_APP_URL\", \"http://localhost:5173/entraid-redirect.html\", \"https://localhost:5173/entraid-redirect.html\", \"$AZURE_STATIC_APP_URL/entraid-redirect.html\"]}"
```

- [ ] **Step 6: Verify the bridge output and registration parity**

Run:

```powershell
npm run build
if (-not (Test-Path dist\entraid-redirect.html)) { throw 'Bridge file was not emitted' }
Select-String -Path infra\hooks\postprovision.ps1,infra\hooks\postprovision.sh -Pattern 'entraid-redirect.html'
```

Expected: build exits with code 0, `dist\entraid-redirect.html` exists, and both hook files contain all three bridge URI variants.

- [ ] **Step 7: Commit the bridge**

```powershell
git add entraid-redirect.html vite.config.ts infra/hooks/postprovision.ps1 infra/hooks/postprovision.sh
git commit -m "fix: add MSAL redirect bridge" -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 3: Recoverable Header Authentication Errors

**Files:**
- Create: `src/components/Header/AuthBtn/AuthBtn.test.tsx`
- Modify: `src/components/Header/AuthBtn/AuthBtn.tsx`
- Modify: `src/components/Header/AuthBtn/AuthBtn.module.scss`

**Interfaces:**
- Consumes: `IAuthService.signIn(): Promise<void>` and `signOut(): Promise<void>`
- Produces: retryable inline error text and a disabled button while an interaction is pending

- [ ] **Step 1: Write failing interaction tests**

Create `src/components/Header/AuthBtn/AuthBtn.test.tsx`:

```typescript
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { describe, expect, it, vi } from 'vitest';
import { appServicesAtom } from '@/atoms/appServicesAtom';
import { configAtom } from '@/atoms/configAtom';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import AuthBtn from './AuthBtn';

function renderAuthButton(signIn: () => Promise<void>): void {
  render(
    <RecoilRoot
      initializeState={({ set }) => {
        set(configAtom, {
          title: 'Portal',
          dataApiHostName: 'api.example.test',
          scopingFilter: '',
          capabilities: [],
          authentication: {
            clientId: 'client',
            tenantId: 'tenant',
            authority: 'https://login.microsoftonline.com/',
            azureAdInstance: '',
            scopes: ['scope'],
          },
        });
        set(isAuthenticatedAtom, false);
        set(appServicesAtom, {
          AuthService: {
            isAuthenticated: () => Promise.resolve(false),
            getAccessToken: () => Promise.resolve(''),
            signIn,
            signOut: () => Promise.resolve(),
          },
        });
      }}
    >
      <AuthBtn />
    </RecoilRoot>
  );
}

describe('AuthBtn', () => {
  it('keeps the portal usable when popup sign-in fails', async () => {
    const signIn = vi.fn(() => Promise.reject(new Error('popup_window_error')));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderAuthButton(signIn);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Sign-in was not completed. Please try again.'
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveProperty('disabled', false);
  });

  it('prevents concurrent popup interactions', async () => {
    let resolveSignIn: () => void = () => undefined;
    const signIn = vi.fn(
      () => new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      })
    );
    renderAuthButton(signIn);

    const button = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Signing in...' })).toHaveProperty('disabled', true);
    resolveSignIn();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sign out' })).toHaveProperty('disabled', false)
    );
  });
});
```

- [ ] **Step 2: Run the tests and confirm current behavior fails**

Run:

```powershell
npx vitest run src/components/Header/AuthBtn/AuthBtn.test.tsx
```

Expected: FAIL because the rejected promise is unhandled and no alert or pending state exists.

- [ ] **Step 3: Implement local error and pending state**

Update `src/components/Header/AuthBtn/AuthBtn.tsx` to import `MessageBar`, `MessageBarBody`, and `useState`. Add:

```typescript
function getAuthenticationErrorCode(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'errorCode' in error &&
    typeof error.errorCode === 'string'
  ) {
    return error.errorCode;
  }

  return 'unknown_error';
}

const [error, setError] = useState<string>();
const [isPending, setIsPending] = useState(false);
```

Replace `handleClick` with:

```typescript
const handleClick = useCallback(async () => {
  if (isPending) {
    return;
  }

  setError(undefined);
  setIsPending(true);

  try {
    if (isAuthenticated) {
      await AuthService.signOut();
      setIsAuthenticated(false);
      window.location.href = window.location.origin;
      return;
    }

    await AuthService.signIn();
    setIsAuthenticated(true);
  } catch (authError) {
    console.error(`Authentication interaction failed (${getAuthenticationErrorCode(authError)}).`);
    setError(
      isAuthenticated
        ? 'Sign-out was not completed. Please try again.'
        : 'Sign-in was not completed. Please try again.'
    );
  } finally {
    setIsPending(false);
  }
}, [AuthService, isAuthenticated, isPending, setIsAuthenticated]);
```

Render:

```tsx
<div className={styles.authControl}>
  <Button
    className={styles.authBtn}
    appearance="primary"
    disabled={isPending}
    onClick={handleClick}
  >
    {isPending ? (isAuthenticated ? 'Signing out...' : 'Signing in...') : isAuthenticated ? 'Sign out' : 'Sign in'}
  </Button>
  {error && (
    <MessageBar className={styles.authError} intent="error" role="alert">
      <MessageBarBody>{error}</MessageBarBody>
    </MessageBar>
  )}
</div>
```

- [ ] **Step 4: Add compact header styling**

Append to `src/components/Header/AuthBtn/AuthBtn.module.scss`:

```scss
.authControl {
  position: relative;
}

.authError {
  position: absolute;
  z-index: 1;
  top: calc(100% + 8px);
  right: 0;
  width: max-content;
  max-width: 320px;
}
```

- [ ] **Step 5: Run component and existing authorization tests**

Run:

```powershell
npx vitest run src/components/Header/AuthBtn/AuthBtn.test.tsx src/hooks/useApiAuthorization.test.tsx src/utils/apiAuth.test.ts
```

Expected: all tests PASS with no unhandled rejection.

- [ ] **Step 6: Commit recoverable error handling**

```powershell
git add src/components/Header/AuthBtn/AuthBtn.tsx src/components/Header/AuthBtn/AuthBtn.module.scss src/components/Header/AuthBtn/AuthBtn.test.tsx
git commit -m "fix: handle Entra popup failures locally" -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 4: Authentication Documentation and Full Verification

**Files:**
- Modify: `.wiki/authentication.md`
- Modify: `.wiki/configuration.md`
- Modify: `.wiki/deployment.md`

**Interfaces:**
- Consumes: exact `/entraid-redirect.html` contract from Tasks 1 and 2
- Produces: deployment instructions matching runtime behavior

- [ ] **Step 1: Correct the authentication architecture**

Update `.wiki/authentication.md` to state:

```markdown
**Library**: `@azure/msal-browser` v5.18.0

The portal and MCP authentication services share one lazily initialized
`PublicClientApplication`. The client uses
`${window.location.origin}/entraid-redirect.html` as its fixed redirect URI.
The bridge page broadcasts popup and silent-flow responses back to the main
frame and must not receive a `Cross-Origin-Opener-Policy` header.
```

Replace redirect-based sign-in diagrams with the implemented popup flow:

```text
loginPopup()
  -> Microsoft Entra ID
  -> /entraid-redirect.html
  -> broadcastResponseToMainFrame()
  -> popup promise resolves
  -> active account is set
```

- [ ] **Step 2: Correct runtime configuration documentation**

Remove `authentication.redirectUri` from `.wiki/configuration.md`. Document that
the redirect URI is derived from the current origin and fixed to
`/entraid-redirect.html`; it is not a `config.json` property.

- [ ] **Step 3: Add exact deployment requirements**

Add to `.wiki/deployment.md`:

```markdown
Register `https://<portal-origin>/entraid-redirect.html` as a **Single-page
application (SPA)** redirect URI in the Entra app registration. The protocol,
host, port, and path must match exactly. Keep the bridge response free of COOP
headers so it can communicate with the portal through MSAL's redirect bridge.
```

- [ ] **Step 4: Run full project validation**

Run:

```powershell
npm test
npm run lint
npm run build
if (-not (Test-Path dist\entraid-redirect.html)) { throw 'Bridge file was not emitted' }
git --no-pager diff --check
```

Expected: tests, lint, and build exit with code 0; the bridge exists; diff check reports no errors.

- [ ] **Step 5: Commit documentation**

```powershell
git add .wiki/authentication.md .wiki/configuration.md .wiki/deployment.md
git commit -m "docs: document Entra redirect bridge" -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```
