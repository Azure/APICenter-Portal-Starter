# Entra Popup Login Fix Design

## Goal

Restore reliable Microsoft Entra ID popup authentication in browsers that enforce
Cross-Origin-Opener-Policy (COOP), while preserving the portal's existing popup
sign-in experience.

## Root Cause

The regression began in commit `47ab821`, which changed the inline OAuth
callback bridge in `index.html` to parse URL fragments. Because MSAL v3 had no
dedicated redirect URI, Entra redirected its `#code=...` response to
`index.html`; the OAuth bridge misidentified it as its own callback, posted it,
and closed the popup. MSAL then rejected while polling `window.closed`. The
console COOP warning was collateral, not the root cause. Commit `4b1538c`
turned that rejection into the global "Oops, something went wrong" page through
the unhandled-rejection error boundary.

## Approach

Upgrade to MSAL Browser v5 and adopt its supported redirect bridge pattern. Keep
popup sign-in and popup sign-out to avoid changing the portal's authentication
experience.

Changing deployment headers is not part of this fix. It is less portable across
hosting environments and does not modernize the unsupported popup response
handling. Full-page redirect authentication is also excluded because it changes
the established user experience without being necessary.

## Components

### MSAL service

`MsalAuthService` will:

- Configure a dedicated redirect URI at `/entraid-redirect.html`, resolved against
  `window.location.origin`.
- Continue lazy initialization of a single `PublicClientApplication`. One
  module-level singleton will own account cache, active-account state, and
  interactive request state for the application.
- Continue using `loginPopup` and setting the returned account as active.
- Continue using `acquireTokenSilent` for API tokens.
- Preserve backward-compatible scope and authority normalization.

The MCP-specific MSAL service uses the same browser library and must use the
same redirect bridge URI so its interactive token popup remains COOP-safe.

### Redirect bridge

A minimal root-level `entraid-redirect.html` Vite entry will import
`broadcastResponseToMainFrame` from `@azure/msal-browser/redirect-bridge`.
It will not initialize React, routing, application services, or API requests.

`vite.config.ts` will define both `index.html` and `entraid-redirect.html` as build
inputs so the production bundle always contains the bridge page.

The bridge page must not be served with a COOP header. The repository does not
currently define such headers, so no hosting-header change is required.

### Entra app registration

The provisioning hooks will retain the existing root redirect URIs and also
register `/entraid-redirect.html` for:

- `http://localhost:5173`
- `https://localhost:5173`
- The provisioned Azure Static Web Apps origin

Existing manually managed app registrations must add the exact production
`https://<portal-origin>/entraid-redirect.html` URI as a SPA redirect URI before the
updated portal is deployed.

### User-facing error handling

The authentication button will catch sign-in and sign-out failures at the
interaction boundary. A failed or cancelled popup will leave authentication
state unchanged and surface a concise retryable error in a Fluent UI
`MessageBar` associated with the header authentication control. It will not
become an unhandled promise rejection or trigger the global application error
page.

Diagnostic logging will preserve MSAL's stable `errorCode` when available
without exposing tokens or account data.

## Data Flow

1. The user selects **Sign in**.
2. `MsalAuthService` opens the Entra authorization endpoint in a popup with
   `/entraid-redirect.html` as the redirect URI.
3. Entra redirects the popup to the bridge page with the authorization response.
4. The bridge broadcasts the response to the main frame using MSAL v5.
5. `loginPopup` resolves, the returned account becomes active, and the portal
   marks the user authenticated.
6. API requests obtain access tokens through `acquireTokenSilent`.

If any authentication step rejects, the button handles the error and leaves the
portal usable.

## Testing

Automated tests will verify:

- The MSAL configuration uses the dedicated bridge URI.
- Successful popup login activates the returned account.
- Popup rejection does not set authenticated state or escape as an unhandled
  rejection.
- The Vite production build emits `entraid-redirect.html`.
- Existing authentication and API authorization tests continue to pass.

Targeted tests, type checking, linting, and a production build will validate the
implementation.

## Documentation

Update `.wiki/authentication.md`, `.wiki/configuration.md`, and deployment
guidance so the documented MSAL configuration, redirect flow, and app
registration requirements match the implementation.
