# Entra ID Auth Support for MCP Inspector

## Problem

The RFC 9728 flow discovers OAuth metadata (authorization server, scopes) for MCP servers, but when the auth server is Microsoft Entra ID, dynamic client registration is not supported (`registration_endpoint` is absent from the openid-configuration). The discovery flow currently returns `undefined` in this case, leaving the user with a "discovery failed" error.

## Solution

When dynamic registration is unavailable, use the portal's existing MSAL instance to acquire a token with the discovered scopes. The user is already signed into the portal — `acquireTokenSilent` should succeed immediately. If consent is needed, show a minimal "Sign in" button.

## Architecture

### New type: `McpDiscoveredAuth`

Added to `src/types/mcp.ts`:

```typescript
export interface McpDiscoveredAuth {
  type: 'msal';
  authority: string;   // e.g., "https://login.microsoftonline.com/{tenant}/v2.0"
  scopes: string[];    // from protected resource metadata scopes_supported
}
```

### McpAuthService changes

`discoverFromWwwAuthenticate` return type changes from `Oauth2Credentials | undefined` to `Oauth2Credentials | McpDiscoveredAuth | undefined`.

Flow when `registration_endpoint` is absent:
1. Resource metadata provides `scopes_supported` and `authorization_servers[0]`
2. Auth server metadata confirms `authorization_endpoint` and `token_endpoint` exist
3. Instead of failing, return `McpDiscoveredAuth` with authority (the issuer) and scopes (from resource metadata)

`discoverOAuthCredentials` (the proactive `.well-known` path) is unchanged — it still returns `Oauth2Credentials | undefined`.

### McpSpecPage orchestration

In `makeApiSpec` error handler, when `discoverFromWwwAuthenticate` returns `McpDiscoveredAuth`:

1. Get the existing MSAL instance via `MsalAuthService`
2. Call `acquireTokenSilent({ scopes: discoveredAuth.scopes })`
3. **Silent succeeds:** Set `authCredentials` with the Bearer token, set `AUTHORIZED`, MCP connection retries with token
4. **Silent fails (interaction required):** Set state to `MSAL_CONSENT_NEEDED`, store the discovered scopes
5. Show a simple UI: "This MCP server requires additional permissions. Click to sign in."
6. On click: `acquireTokenPopup({ scopes })` → token → set `AUTHORIZED`

New auth state enum value: `MSAL_CONSENT_NEEDED`

### Token acquisition strategy

- `acquireTokenSilent` first (zero-click for already-consented users)
- Fall back to `acquireTokenPopup` if interaction is required
- Uses the portal's configured MSAL instance (same `clientId` and authority from `config.json`)
- The portal's Entra ID app registration must have the MCP server's API permission added by the admin

## Files Changed

| File | Change |
|------|--------|
| `src/types/mcp.ts` | Add `McpDiscoveredAuth` interface |
| `src/services/McpAuthService.ts` | Return `McpDiscoveredAuth` when no `registration_endpoint`; update return type |
| `src/pages/ApiSpec/McpSpecPage/McpSpecPage.tsx` | Handle `McpDiscoveredAuth`: silent token, `MSAL_CONSENT_NEEDED` state, consent button |
| `src/pages/ApiSpec/McpSpecPage/McpSpecPage.module.scss` | Minor style for consent button (reuse existing `authPanel` pattern) |

## User Configuration

For Entra ID-protected MCP servers, the portal admin must:
1. Add the MCP server's API permission (the scope, e.g., `api://29527edc.../...default`) to the portal's Entra ID app registration
2. Grant admin consent (or allow user consent) for that permission

No changes to `config.json` are needed beyond the existing `authentication` block.

## Scope Boundaries

**In scope:**
- Returning discovered auth metadata when dynamic registration is unavailable
- Silent MSAL token acquisition with discovered scopes
- Popup consent fallback
- Minimal consent UI

**Out of scope:**
- Cross-tenant MSAL (use portal's configured instance)
- Token refresh (MSAL handles internally)
- Changes to `MsalAuthService` itself
- Admin configuration UI for API permissions
