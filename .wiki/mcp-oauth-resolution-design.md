# MCP OAuth Resolution — Design

## Status

Approved design. Source: IcM **829508903** (Sev3) / ADO work item **38697220** —
*"[Dev Portal] MCP OAuth token retrieval hits wrong URL (404) — well-known discovery
runs before pre-configured auth and builds RFC 8414 URL incorrectly."*

## Problem

A customer configures OAuth for an MCP server in API Center, but the Developer Portal
cannot list/test the server's tools. The browser HAR shows the portal performing OAuth
token retrieval against an **incorrect URL, returning HTTP 404**.

There are two sources of OAuth information for an MCP server:

| Source | Where it lives | Read by |
|---|---|---|
| **A. Pre-configured** ("API access" auth set in API Center) | RP `securityRequirements` / `:getCredentials` | `ApiService.getSecurityRequirements` / `getSecurityCredentials` — returns a fully populated `Oauth2Credentials { clientId, authorizationUrl, tokenUrl, supportedScopes, supportedFlows }` |
| **B. Discovered** (RFC 8414 / RFC 9728 from the MCP server) | `.well-known/*` on the MCP server and its auth server | `McpAuthService.discoverOAuthCredentials` (proactive) + `discoverFromWwwAuthenticate` (reactive, on 401) |

### Root causes (all in `src/services/McpAuthService.ts` and the flow that calls it)

1. **Discovery runs first and unconditionally.** `McpSpecPage.determineAuthFlow` calls
   `discoverOAuthCredentials` *before* `getSecurityRequirements`, so buggy discovery can
   shadow the correct pre-configured endpoints even when Source A is present.

2. **Proactive discovery strips the server path.** `discoverOAuthCredentials` reduces the
   server URI to its `origin` and queries `${origin}/.well-known/oauth-authorization-server`.
   For path-based MCP servers (the common APIM case, e.g.
   `https://{svc}.azure-api.net/{api}/mcp`) this hits the wrong location and can return a
   different auth server's `token_endpoint` or 404. RFC 9728 requires path-aware discovery.

3. **RFC 8414 well-known URL built incorrectly.** `fetchAuthServerMetadata` appends the
   well-known segment *after* the issuer path. RFC 8414 §3.1 requires it to be **inserted
   between host and path**:
   - issuer `https://host/tenant1`
   - correct → `https://host/.well-known/oauth-authorization-server/tenant1`
   - current (wrong) → `https://host/tenant1/.well-known/oauth-authorization-server`

   It only "works" today because the OpenID Connect fallback (Entra) happens to use the
   appended form. A spec-compliant AS serving only RFC 8414 under a path fails or yields
   the wrong `token_endpoint`.

Any of defects 2/3 reproduces the HAR symptom: the portal POSTs to a wrong/nonexistent
`token_endpoint` → **404** (`OAuthService.authenticateCodeWithPkce` POSTs to
`credentials.tokenUrl`).

### Answers to the two review questions

- **Do we properly read OAuth info?** Pre-configured (Source A): **yes** — no URL is
  rebuilt, so no 404 on this path. Discovered (Source B): **no** — defects 2 and 3 produce
  a wrong/nonexistent `token_endpoint`.
- **If auth info is already set, do we need a well-known endpoint?** **No.** Source A already
  contains `authorizationUrl` + `tokenUrl` + scopes + flows. Discovery exists only to derive
  those values when they are not configured.

## Target behavior

```
1. If pre-configured auth exists (securityRequirements non-empty)
     → use it directly. No well-known call.            (Source A wins)
2. Else attempt proactive discovery (path-aware, RFC 9728 → RFC 8414);
   and on a 401 during the actual MCP call, use the WWW-Authenticate
   (RFC 9728) discovery that already exists.
3. Else → anonymous / AUTHORIZED
```

## Scope

In scope: reorder `determineAuthFlow`; fix RFC 8414 URL construction; make proactive
discovery path-aware per RFC 9728. The proactive shortcut is **kept but corrected** (not
removed). The reactive 401 → `discoverFromWwwAuthenticate` path is already correct and is
left unchanged.

Out of scope: automated tests (the repo has no test runner configured; validation is via
`npm run lint`, `tsc`, and manual testing per `.wiki/testing-strategy.md`), any RP/backend
changes, MSAL/Entra consent flow changes.

## Design

### 1. Auth-flow reordering — `src/pages/ApiSpec/McpSpecPage/McpSpecPage.tsx`

Swap the order inside `determineAuthFlow` so pre-configured auth wins:

1. `getSecurityRequirements(definitionId)` → if non-empty → `API_ACCESS_FLOW`
   (uses the correct pre-configured `tokenUrl`; **no** well-known call).
2. Else `discoverOAuthCredentials(runtimeUri)` (now path-aware) → if creds →
   `DYNAMIC_REGISTRATION_FLOW`.
3. Else → `AUTHORIZED` (anonymous).

The reactive 401 → `discoverFromWwwAuthenticate` handling in `makeApiSpec` is unchanged.

### 2. RFC 8414 URL construction — `fetchAuthServerMetadata`

Build the authorization-server metadata URL by **inserting** the well-known segment between
host and path (RFC 8414 §3.1), instead of appending it.

- issuer with path `https://host/tenant1`:
  - `https://host/.well-known/oauth-authorization-server/tenant1` (RFC 8414, inserted)
  - `https://host/.well-known/openid-configuration/tenant1` (OIDC, inserted)
  - `https://host/tenant1/.well-known/openid-configuration` (append — kept as Entra-compat fallback)
- issuer without path `https://host`:
  - `https://host/.well-known/oauth-authorization-server`
  - `https://host/.well-known/openid-configuration`

Candidates are tried in order; the first `2xx` wins. `validateMetadataUrl` continues to run
on every candidate before fetching.

### 3. Path-aware RFC 9728 — `discoverOAuthCredentials`

Stop reducing the server URI to `origin`. For MCP server URI
`https://svc.azure-api.net/myapi/mcp`:

1. Fetch protected-resource metadata at
   `https://svc.azure-api.net/.well-known/oauth-protected-resource/myapi/mcp`
   (well-known **inserted before** the path per RFC 9728).
2. Fall back to the root form
   `https://svc.azure-api.net/.well-known/oauth-protected-resource`.
3. Validate the `resource` field matches the server, follow `authorization_servers[0]` →
   `fetchAuthServerMetadata` (fixed in §2) → `registerClient`.

This routes proactive discovery through the same correct machinery as the reactive 401 path,
so both build identical URLs.

### RFC URL-construction summary

| RFC | Metadata | Rule for issuer/resource with a path | Example |
|---|---|---|---|
| 8414 | Authorization Server | well-known **inserted** between host and path | `host/.well-known/oauth-authorization-server/tenant1` |
| 9728 | Protected Resource | well-known **inserted** between host and path, root fallback | `host/.well-known/oauth-protected-resource/myapi/mcp` |
| OIDC (fallback) | Authorization Server | appended after path (Entra-compat) | `host/tenant1/.well-known/openid-configuration` |

## Affected files

- `src/pages/ApiSpec/McpSpecPage/McpSpecPage.tsx` — flow ordering (§1).
- `src/services/McpAuthService.ts` — `discoverOAuthCredentials` (§3), `fetchAuthServerMetadata` (§2).
- `src/services/OAuthService.ts` — consumer of the resulting `tokenUrl`; **no change**.

## Validation

- `npm run lint` and `tsc` pass.
- Manual: a path-based APIM MCP server with pre-configured OAuth in API Center lists/tests
  tools without a 404; a server relying only on discovery resolves the correct
  `token_endpoint` for both path-based and root issuers.
