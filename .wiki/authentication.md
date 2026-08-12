# Authentication Architecture

## Authentication Modes

### 1. Authenticated Mode (MSAL)

**Trigger**: `config.authentication` object present in config.json

**Configuration**:
```json
{
  "authentication": {
    "clientId": "app-registration-guid",
    "tenantId": "tenant-guid",
    "scopes": ["https://azure-apicenter.net/Data.Read.All"],
    "authority": "https://login.microsoftonline.com/"
  }
}
```

**Service**: `MsalAuthService`
**Library**: `@azure/msal-browser` v5.18.0

---

### 2. Anonymous Mode

**Trigger**: `config.authentication` absent or undefined

**Service**: `AnonymousAuthService`
**Behavior**: No-op auth methods, immediate access

---

## MSAL Integration

### Shared client initialization

**When**: First call to an auth method
**Where**: `MsalClient.ts` (lazy initialization)

`MsalAuthService` and `McpMsalAuthService` both reuse the same lazily initialized
`PublicClientApplication`. The MSAL config resolves the redirect URI from the
current origin as `${window.location.origin}/entraid-redirect.html`. The bridge page imports
`broadcastResponseToMainFrame` from `@azure/msal-browser/redirect-bridge`,
forwards popup and silent responses back to the main frame, and must not be
served with a `Cross-Origin-Opener-Policy` header.

**MSAL Config**:
```typescript
{
  auth: {
    clientId: config.authentication.clientId,
    authority: `${config.authentication.authority}${config.authentication.tenantId}`,
    redirectUri: getEntraRedirectUri(),
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}
```

### Popup sign-in flow

```text
loginPopup()
  -> Microsoft Entra ID
  -> /entraid-redirect.html
  -> broadcastResponseToMainFrame()
  -> popup promise resolves
  -> active account is set
```

### Token acquisition

`getAccessToken()` continues to use `acquireTokenSilent()` for portal API calls.
MCP interactive token requests use `acquireTokenPopup()` through the same bridge
when user interaction is required.

---

## Anonymous Auth

### Implementation

```typescript
export const AnonymousAuthService: IAuthService = {
  isAuthenticated: () => Promise.resolve(true),
  getAccessToken: () => Promise.resolve(''),
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
};
```

### Behavior

**isAuthenticated**: Always returns `true` (immediate access)
**getAccessToken**: Returns empty string (no token)
**signIn/signOut**: No-ops

### HTTP Requests

When `getAccessToken()` returns empty string, `HttpService` skips adding Authorization header:
```typescript
if (accessToken) {
  headers.append('Authorization', 'Bearer ' + accessToken);
}
```

---

## Auth State Management

### isAuthenticatedAtom

**Type**: Atom with async effect
**Default**: `false`
**Initialization**: Calls `AuthService.isAuthenticated()` after services ready

**Flow**:
```
1. Atom created with default false
2. Effect scheduled (setTimeout)
3. Effect checks if appServicesAtom has AuthService
4. If not ready, retry on next tick
5. Once ready, call AuthService.isAuthenticated()
6. Set atom to result
```

**Why Retry Loop**: Guards against startup race where config isn't loaded yet

---

### isAnonymousAccessEnabledAtom

**Type**: Selector (computed)
**Derived From**: `configAtom`

```typescript
get: ({ get }) => {
  const config = get(configAtom);
  return !config?.authentication;
}
```

**Usage**: UI decisions (hide sign-in button, VS Code links, etc.)

---

### isAccessDeniedAtom

**Type**: Atom
**Default**: `false`
**Set By**: `HttpService` on 401/403 responses

**Behavior**: When set to `true`, app shows access denied page or prompt

---

## UI Authentication Flows

### Sign-In Flow (Authenticated Mode)

```text
User lands on portal
  └─► isAuthenticatedAtom = false
       └─► Home page renders "Sign in to view APIs"
            └─► User clicks "Sign In" button
                 └─► AuthService.signIn()
                      └─► MSAL opens Entra sign-in popup
                           └─► Entra redirects the popup to /entraid-redirect.html
                                └─► bridge posts the response back
                                     └─► popup promise resolves
                                          └─► active account is set
                                               └─► isAuthenticatedAtom updates to true
                                                    └─► Home page fetches APIs
```

### Auto-Sign-In (if user has active session)

```
User lands on portal
  └─► isAuthenticatedAtom effect runs
       └─► AuthService.isAuthenticated()
            └─► MSAL checks cache
                 └─► Valid token found
                      └─► isAuthenticatedAtom = true
                           └─► Home page renders API list
```

### Anonymous Access Flow

```
User lands on portal
  └─► isAuthenticatedAtom effect runs
       └─► AuthService.isAuthenticated() (AnonymousAuthService)
            └─► Returns true immediately
                 └─► isAuthenticatedAtom = true
                      └─► Home page fetches APIs (no token)
```

---

## Auth-Dependent Features

### Visible Only When Authenticated

- Sign-in button (shown when not authenticated)
- Sign-out button (shown when authenticated)
- VS Code integration links
- User profile display (TODO: verify if implemented)

### Hidden in Anonymous Mode

- Sign-in/out buttons
- Header separator (next to auth button)
- "Open in VS Code" buttons in ApiInfoOptions
- OAuth 2.0 test console flows (TODO: verify)

---

## Error Handling

### Token Acquisition Failures

**MSAL Errors**:
- `user_cancelled`: User closed login window
- `interaction_required`: Silent token refresh failed, needs interaction
- `consent_required`: User hasn't consented to scopes

**Portal Behavior**: Leave auth state unchanged and surface a retryable popup error

### API Access Denied

**Scenario**: Valid token but insufficient permissions
**HTTP Status**: 403 Forbidden
**Portal Behavior**: Set `isAccessDeniedAtom`, show access denied message

### Expired Token

**Scenario**: Token expired mid-session
**MSAL Behavior**: Auto-refresh on next API call
**Fallback**: Surface an interaction_required error and let the caller retry through the popup-based auth flow

---

## Security Considerations

### Token Storage

**Location**: `sessionStorage` (default MSAL config)
**Alternative**: `localStorage` (persists across tabs/sessions)
**Security**: XSS risk if site compromised, but standard practice for SPAs

### Token Exposure

**Where Sent**: Only to Azure API Center data plane API
**Header**: `Authorization: Bearer {token}`
**HTTPS**: Required (enforced by Azure)

### CORS

**Requirement**: Azure API Center must allow portal origin
**Mechanism**: API Management gateway (if used) or API Center CORS config
**TODO**: Verify CORS configuration in infrastructure

---

## Multi-Tenant Considerations

### Single Tenant

**Config**: Specific `tenantId` in `authentication.tenantId`
**Authority**: `https://login.microsoftonline.com/{tenantId}`
**Users**: Only from that tenant

### Multi-Tenant

**Config**: `tenantId` = `common` or `organizations`
**Authority**: `https://login.microsoftonline.com/common`
**Users**: Any Azure AD user
**TODO**: Verify if supported by starter template

---

## Testing Auth Flows

### Mocking MSAL

**Challenge**: MSAL requires real Azure AD
**Strategy**: Mock `MsalAuthService` in tests

```typescript
const mockAuthService: IAuthService = {
  isAuthenticated: jest.fn().mockResolvedValue(true),
  getAccessToken: jest.fn().mockResolvedValue('fake-token'),
  signIn: jest.fn(),
  signOut: jest.fn(),
};

<RootProvider services={{ AuthService: mockAuthService }}>
  <App />
</RootProvider>
```

### Testing Anonymous Mode

**Strategy**: Provide config without `authentication` property
```typescript
<RecoilRoot initializeState={({ set }) => {
  set(configAtom, { dataApiHostName: 'test', title: 'Test' });
}}>
  <App />
</RecoilRoot>
```

---

## Auth Service Interface

```typescript
interface IAuthService {
  isAuthenticated(): Promise<boolean>;
  getAccessToken(): Promise<string>;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}
```

### isAuthenticated()

**Purpose**: Check if user is signed in
**Returns**: `Promise<boolean>`
**MSAL**: Checks if accounts exist in cache
**Anonymous**: Always `true`

### getAccessToken()

**Purpose**: Get access token for API calls
**Returns**: `Promise<string>` (empty string if no token)
**MSAL**: Silent token acquisition; popup for interactive MCP requests
**Anonymous**: Returns `''`

### signIn()

**Purpose**: Initiate sign-in flow
**Returns**: `Promise<void>`
**MSAL**: Open Entra sign-in popup
**Anonymous**: No-op

### signOut()

**Purpose**: Sign out user
**Returns**: `Promise<void>`
**MSAL**: Open Entra sign-out popup and clear cache
**Anonymous**: No-op

---

## TODO: Auth Questions

- [ ] Is user profile display implemented?
- [ ] CORS configuration details
- [ ] Multi-tenant support verification
- [ ] Token refresh strategy (proactive vs reactive)
- [ ] Session timeout handling
- [ ] Remember me / persistent login option
- [ ] Role-based access control (if any)
- [ ] API permissions beyond Data.Read.All
