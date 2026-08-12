# Entra Popup Login Fix Design

## Goal

Restore reliable Microsoft Entra ID popup authentication in browsers that enforce
Cross-Origin-Opener-Policy (COOP), while preserving the portal's existing popup
sign-in experience.

## Root Cause

The portal uses `@azure/msal-browser` 3.13.0 and sends the full SPA page as the
popup redirect target. Microsoft Entra ID now enables COOP by default. That
policy can sever the opener relationship that MSAL v3 relies on to return the
authentication response from the popup. The rejected `loginPopup` promise is
also unhandled by the sign-in button, so the global error boundary replaces the
application with the generic error page.

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

- Configure a dedicated redirect URI at `/redirect.html`, resolved against
  `window.location.origin`.
- Continue lazy initialization of a single `PublicClientApplication`.
- Continue using `loginPopup` and setting the returned account as active.
- Continue using `acquireTokenSilent` for API tokens.
- Preserve backward-compatible scope and authority normalization.

The MCP-specific MSAL service uses the same browser library and must use the
same redirect bridge URI so its interactive token popup remains COOP-safe.

### Redirect bridge

A minimal root-level `redirect.html` Vite entry will import
`broadcastResponseToMainFrame` from `@azure/msal-browser/redirect-bridge`.
It will not initialize React, routing, application services, or API requests.

`vite.config.ts` will define both `index.html` and `redirect.html` as build
inputs so the production bundle always contains the bridge page.

The bridge page must not be served with a COOP header. The repository does not
currently define such headers, so no hosting-header change is required.

### Entra app registration

The provisioning hooks will retain the existing root redirect URIs and also
register `/redirect.html` for:

- `http://localhost:5173`
- `https://localhost:5173`
- The provisioned Azure Static Web Apps origin

Existing manually managed app registrations must add the exact production
`https://<portal-origin>/redirect.html` URI as a SPA redirect URI before the
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
   `/redirect.html` as the redirect URI.
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
- The Vite production build emits `redirect.html`.
- Existing authentication and API authorization tests continue to pass.

Targeted tests, type checking, linting, and a production build will validate the
implementation.

## Documentation

Update `.wiki/authentication.md`, `.wiki/configuration.md`, and deployment
guidance so the documented MSAL configuration, redirect flow, and app
registration requirements match the implementation.
