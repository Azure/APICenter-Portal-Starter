# RFC 9728 WWW-Authenticate Support for MCP Inspector

## Problem

The MCP inspector does not handle `WWW-Authenticate` response headers. When the MCP server returns a `401 Unauthorized`, the code throws `McpUnauthorizedError` without inspecting any response headers.

The current OAuth discovery uses a hardcoded `.well-known/oauth-authorization-server` path (the older MCP auth pattern). Servers that use the newer RFC 9728 OAuth Protected Resource Metadata pattern are not supported.

### RFC 9728 Flow

1. Server returns `401` with `WWW-Authenticate: Bearer resource_metadata="<url>"`
2. Client fetches that `resource_metadata` URL → Protected Resource Metadata JSON
3. That JSON contains `authorization_servers` pointing to the OAuth authorization server
4. Client fetches the authorization server's metadata
5. Client performs dynamic client registration and token acquisition

## Approach

Support both discovery methods:

- **Proactive:** Try `.well-known/oauth-authorization-server` first (existing behavior)
- **Reactive:** If `.well-known` fails and the MCP server returns a 401 with a `WWW-Authenticate` header, follow the RFC 9728 flow

When multiple `authorization_servers` are listed in the resource metadata, use the first one.

All metadata fetches go through the existing CORS proxy mechanism (`apimFetchProxy`) when enabled.

## Architecture

### New Service: `src/services/McpAuthService.ts`

A dedicated service that consolidates all MCP auth discovery logic. Absorbs the existing `getMcpServerOAuthCredentials()` from `mcp.ts`.

**Public API:**

```typescript
class McpAuthService {
  // Tries .well-known OAuth discovery (existing behavior, moved from mcp.ts)
  static discoverOAuthCredentials(serverUri: string): Promise<Oauth2Credentials | undefined>

  // RFC 9728: parses WWW-Authenticate header, follows resource_metadata chain
  static discoverFromWwwAuthenticate(wwwAuthHeader: string): Promise<Oauth2Credentials | undefined>
}
```

**Internal methods:**

- `parseWwwAuthenticate(header: string): string | undefined` — Extracts `resource_metadata` URL from `Bearer resource_metadata="<url>"` pattern
- `fetchResourceMetadata(url: string): Promise<McpProtectedResourceMetadata>` — Fetches protected resource metadata JSON
- `fetchAuthServerMetadata(url: string): Promise<McpServerAuthMetadata>` — Fetches OAuth authorization server metadata
- `registerClient(metadata: McpServerAuthMetadata): Promise<Oauth2Credentials | undefined>` — Performs dynamic client registration

### Enhanced Error: `McpUnauthorizedError`

Carries the `WWW-Authenticate` header value from the 401 response:

```typescript
export class McpUnauthorizedError extends Error {
  public readonly wwwAuthenticate?: string;
  constructor(message?: string, wwwAuthenticate?: string) {
    super(message || 'MCP server returned 401 Unauthorized.');
    this.name = 'McpUnauthorizedError';
    this.wwwAuthenticate = wwwAuthenticate;
  }
}
```

`McpService.ts` extracts the header on 401 responses (both `initializeStreamableHttp` and `sendStreamableRequest`).

### Updated Orchestration in `McpSpecPage`

```
1. Try McpAuthService.discoverOAuthCredentials(serverUri) → .well-known path
   ├─ Found → DYNAMIC_REGISTRATION_FLOW (existing McpMetadataBasedAuthForm)
   └─ Not found → Check API-configured security requirements
       ├─ Found → API_ACCESS_FLOW (existing ApiAccessAuthForm)
       └─ Not found → Set AUTHORIZED, attempt MCP connection
           └─ On McpUnauthorizedError with wwwAuthenticate:
               → McpAuthService.discoverFromWwwAuthenticate(wwwAuthenticate)
               ├─ Found → DYNAMIC_REGISTRATION_FLOW with discovered credentials
               └─ Not found → Show generic error
```

### New Type: `McpProtectedResourceMetadata`

Added to `src/types/mcp.ts`:

```typescript
export interface McpProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported?: string[];
  bearer_methods_supported?: string[];
  resource_documentation?: string;
}
```

### Cleanup

- Remove `getMcpServerOAuthCredentials()` from `src/utils/mcp.ts`
- Update imports in `McpSpecPage` to use `McpAuthService` instead

## Files Changed

| File | Change |
|------|--------|
| `src/services/McpAuthService.ts` | **New** — consolidated MCP auth discovery service |
| `src/services/McpService.ts` | Enhance `McpUnauthorizedError` to carry `wwwAuthenticate`; extract header on 401 |
| `src/types/mcp.ts` | Add `McpProtectedResourceMetadata` interface |
| `src/pages/ApiSpec/McpSpecPage/McpSpecPage.tsx` | Update auth flow to use `McpAuthService` and handle RFC 9728 fallback |
| `src/utils/mcp.ts` | Remove `getMcpServerOAuthCredentials()` (moved to `McpAuthService`) |

## Error Handling

- If `WWW-Authenticate` header is absent or doesn't contain `resource_metadata`, the RFC 9728 flow is skipped
- If resource metadata fetch fails, fall through to generic error
- If authorization server metadata fetch fails, fall through to generic error
- If dynamic client registration fails, return `undefined` (same as existing behavior)
- All fetch errors are caught and logged with `console.warn` (consistent with existing pattern)

## Scope Boundaries

**In scope:**
- Parsing `WWW-Authenticate` header for `resource_metadata` URL
- Fetching and following the RFC 9728 metadata chain
- Dynamic client registration with discovered metadata
- Consolidating existing `.well-known` discovery into the new service

**Out of scope:**
- Token caching or refresh
- Support for multiple authorization servers (uses first)
- Changes to OAuthService or the OAuth popup flow itself
- SSE transport auth handling (SSE doesn't expose response headers in the same way)
