# RFC 9728 WWW-Authenticate Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add RFC 9728 OAuth Protected Resource Metadata support to the MCP inspector so it follows `WWW-Authenticate` headers on 401 responses.

**Architecture:** New `McpAuthService` consolidates all MCP auth discovery (`.well-known` + RFC 9728). `McpUnauthorizedError` is enhanced to carry the `WWW-Authenticate` header. `McpSpecPage` orchestrates: try `.well-known` first, then on 401 with `WWW-Authenticate`, follow the RFC 9728 chain.

**Tech Stack:** TypeScript, React, existing CORS proxy (`apimFetchProxy`), existing OAuth flow (`OAuthService`)

**Spec:** `docs/superpowers/specs/2026-04-17-rfc9728-www-authenticate-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/types/mcp.ts` | Add `McpProtectedResourceMetadata` interface |
| `src/services/McpAuthService.ts` | **New** — all MCP auth discovery: `.well-known`, RFC 9728 parsing, resource metadata, auth server metadata, client registration, URL validation |
| `src/services/McpService.ts` | Enhance `McpUnauthorizedError` with `wwwAuthenticate` field; extract header on 401; fix `getMcpService()` cache |
| `src/pages/ApiSpec/McpSpecPage/McpSpecPage.tsx` | Updated orchestration: RFC 9728 fallback on 401, state cleanup |
| `src/utils/mcp.ts` | Remove `getMcpServerOAuthCredentials()` (absorbed into `McpAuthService`) |

---

### Task 1: Add `McpProtectedResourceMetadata` type

**Files:**
- Modify: `src/types/mcp.ts:1-85`

- [ ] **Step 1: Add the interface**

Add at the end of `src/types/mcp.ts`, after the `McpSpec` interface:

```typescript
export interface McpProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported?: string[];
  bearer_methods_supported?: string[];
  resource_documentation?: string;
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types/mcp.ts
git commit -m "feat(mcp): add McpProtectedResourceMetadata type for RFC 9728"
```

---

### Task 2: Create `McpAuthService`

**Files:**
- Create: `src/services/McpAuthService.ts`

This service consolidates all MCP auth discovery. It moves the `.well-known` logic from `src/utils/mcp.ts` and adds RFC 9728 support.

- [ ] **Step 1: Create the service file**

Create `src/services/McpAuthService.ts` with the following content:

```typescript
import { McpServerAuthMetadata, McpProtectedResourceMetadata } from '@/types/mcp';
import { Oauth2Credentials, OAuthGrantTypes } from '@/types/apiAuth';
import { apimFetchProxy } from '@/utils/apimProxy';
import { useCorsProxy } from '@/constants';

function mcpFetch(url: string, requestInit?: RequestInit): ReturnType<typeof fetch> {
  if (!useCorsProxy) {
    return fetch(url, requestInit);
  }
  return apimFetchProxy(url, requestInit);
}

/**
 * Parses a WWW-Authenticate header to extract the resource_metadata URL.
 * Handles multiple challenges, case-insensitive scheme/param names,
 * and quoted values that may contain commas.
 *
 * Example header: Bearer resource_metadata="https://example.com/.well-known/oauth-protected-resource"
 */
export function parseWwwAuthenticate(header: string): string | undefined {
  // Match Bearer challenge with resource_metadata parameter
  // The regex handles: Bearer <params>, where params can include quoted strings
  const challenges = header.split(/,\s*(?=[A-Za-z]+ )/);

  for (const challenge of challenges) {
    const trimmed = challenge.trim();

    // Check if this is a Bearer challenge (case-insensitive)
    if (!/^bearer\s/i.test(trimmed)) {
      continue;
    }

    // Extract resource_metadata parameter (case-insensitive key, quoted value)
    const match = trimmed.match(/resource_metadata\s*=\s*"([^"]+)"/i);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Validates that a metadata URL is safe to fetch.
 * Requires HTTPS, rejects localhost/private IPs, fragments, and userinfo.
 */
export function validateMetadataUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'https:') {
      return false;
    }

    if (parsed.hash) {
      return false;
    }

    if (parsed.username || parsed.password) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]') {
      return false;
    }

    // Reject private IP ranges
    if (/^10\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) || /^192\.168\./.test(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that the resource field in protected resource metadata
 * matches the MCP server URI being accessed.
 */
export function validateResourceMetadata(
  metadata: McpProtectedResourceMetadata,
  serverUri: string
): boolean {
  try {
    const resourceUrl = new URL(metadata.resource);
    const serverUrl = new URL(serverUri);
    return resourceUrl.origin === serverUrl.origin;
  } catch {
    return false;
  }
}

/**
 * Derives the OAuth authorization server metadata URL from an issuer identifier
 * per RFC 8414: {issuer}/.well-known/oauth-authorization-server
 */
function deriveAuthServerMetadataUrl(issuer: string): string {
  const url = new URL(issuer);
  // Per RFC 8414, if issuer has a path component, the well-known is inserted
  // after the host: {scheme}://{host}/.well-known/oauth-authorization-server{path}
  if (url.pathname && url.pathname !== '/') {
    return `${url.origin}/.well-known/oauth-authorization-server${url.pathname}`;
  }
  return `${url.origin}/.well-known/oauth-authorization-server`;
}

async function fetchResourceMetadata(url: string): Promise<McpProtectedResourceMetadata | undefined> {
  try {
    const response = await mcpFetch(url, { method: 'GET' });
    if (!response.ok) {
      console.warn(`Failed to fetch resource metadata from ${url}: ${response.status}`);
      return undefined;
    }
    return await response.json();
  } catch (err) {
    console.warn('Failed to fetch protected resource metadata:', err);
    return undefined;
  }
}

async function fetchAuthServerMetadata(issuer: string): Promise<McpServerAuthMetadata | undefined> {
  try {
    const metadataUrl = deriveAuthServerMetadataUrl(issuer);

    if (!validateMetadataUrl(metadataUrl)) {
      console.warn(`Auth server metadata URL failed validation: ${metadataUrl}`);
      return undefined;
    }

    const response = await mcpFetch(metadataUrl, { method: 'GET' });
    if (!response.ok) {
      console.warn(`Failed to fetch auth server metadata from ${metadataUrl}: ${response.status}`);
      return undefined;
    }
    return await response.json();
  } catch (err) {
    console.warn('Failed to fetch auth server metadata:', err);
    return undefined;
  }
}

async function registerClient(metadata: McpServerAuthMetadata): Promise<Oauth2Credentials | undefined> {
  try {
    const registrationResponse = await mcpFetch(metadata.registration_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_name: 'APIC MCP Inspector',
        redirect_uris: [window.location.origin],
        response_types: ['code'],
        grant_types: metadata.grant_types_supported,
        token_endpoint_auth_method: 'none',
      }),
    });

    if (!registrationResponse.ok) {
      console.warn(`Client registration failed: ${registrationResponse.status}`);
      return undefined;
    }

    const { client_id } = await registrationResponse.json();

    return {
      clientId: client_id,
      authorizationUrl: metadata.authorization_endpoint,
      tokenUrl: metadata.token_endpoint,
      supportedScopes: metadata.scopes_supported,
      supportedFlows: metadata.grant_types_supported,
    };
  } catch (err) {
    console.warn('Client registration failed:', err);
    return undefined;
  }
}

export const McpAuthService = {
  /**
   * Proactive discovery via .well-known/oauth-authorization-server.
   * Replaces the old getMcpServerOAuthCredentials() from mcp.ts.
   * No longer fabricates fallback endpoints — returns undefined if discovery fails.
   */
  async discoverOAuthCredentials(serverUri: string): Promise<Oauth2Credentials | undefined> {
    try {
      const origin = new URL(serverUri).origin;

      const metadataResponse = await mcpFetch(`${origin}/.well-known/oauth-authorization-server`, {
        method: 'GET',
      });

      if (!metadataResponse.ok) {
        return undefined;
      }

      const metadata: McpServerAuthMetadata = await metadataResponse.json();
      return registerClient(metadata);
    } catch {
      console.warn('Failed to fetch MCP OAuth credentials — server may not support OAuth or is blocked by CORS.');
      return undefined;
    }
  },

  /**
   * RFC 9728 discovery: parses WWW-Authenticate header, fetches resource metadata,
   * follows authorization_servers link, fetches auth server metadata, registers client.
   */
  async discoverFromWwwAuthenticate(
    wwwAuthHeader: string,
    serverUri: string
  ): Promise<Oauth2Credentials | undefined> {
    try {
      // 1. Parse resource_metadata URL from WWW-Authenticate header
      const resourceMetadataUrl = parseWwwAuthenticate(wwwAuthHeader);
      if (!resourceMetadataUrl) {
        console.warn('No resource_metadata found in WWW-Authenticate header');
        return undefined;
      }

      // 2. Validate the URL is safe to fetch
      if (!validateMetadataUrl(resourceMetadataUrl)) {
        console.warn(`Resource metadata URL failed validation: ${resourceMetadataUrl}`);
        return undefined;
      }

      // 3. Fetch protected resource metadata
      const resourceMetadata = await fetchResourceMetadata(resourceMetadataUrl);
      if (!resourceMetadata) {
        return undefined;
      }

      // 4. Validate resource field matches the MCP server
      if (!validateResourceMetadata(resourceMetadata, serverUri)) {
        console.warn(
          `Resource metadata "resource" field (${resourceMetadata.resource}) does not match server URI (${serverUri})`
        );
        return undefined;
      }

      // 5. Get the first authorization server issuer
      if (!resourceMetadata.authorization_servers?.length) {
        console.warn('No authorization_servers found in resource metadata');
        return undefined;
      }
      const issuer = resourceMetadata.authorization_servers[0];

      // 6. Fetch auth server metadata (derives URL from issuer per RFC 8414)
      const authServerMetadata = await fetchAuthServerMetadata(issuer);
      if (!authServerMetadata) {
        return undefined;
      }

      // 7. Register client
      return registerClient(authServerMetadata);
    } catch (err) {
      console.warn('RFC 9728 discovery failed:', err);
      return undefined;
    }
  },
};
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/services/McpAuthService.ts
git commit -m "feat(mcp): add McpAuthService with .well-known and RFC 9728 discovery"
```

---

### Task 3: Enhance `McpUnauthorizedError` and fix service cache

**Files:**
- Modify: `src/services/McpService.ts:16-21` (McpUnauthorizedError)
- Modify: `src/services/McpService.ts:174-176` (initializeStreamableHttp 401 handler)
- Modify: `src/services/McpService.ts:308-310` (sendStreamableRequest 401 handler)
- Modify: `src/services/McpService.ts:405-408` (getMcpService cache logic)

- [ ] **Step 1: Update `McpUnauthorizedError` to carry `wwwAuthenticate`**

Replace lines 16-21 of `src/services/McpService.ts`:

```typescript
// Old:
export class McpUnauthorizedError extends Error {
  constructor(message = 'MCP server returned 401 Unauthorized. Please check your credentials.') {
    super(message);
    this.name = 'McpUnauthorizedError';
  }
}

// New:
export class McpUnauthorizedError extends Error {
  public readonly wwwAuthenticate?: string;

  constructor(message?: string, wwwAuthenticate?: string) {
    super(message || 'MCP server returned 401 Unauthorized. Please check your credentials.');
    this.name = 'McpUnauthorizedError';
    this.wwwAuthenticate = wwwAuthenticate;
  }
}
```

- [ ] **Step 2: Extract `WWW-Authenticate` header in `initializeStreamableHttp`**

Replace lines 174-176 of `src/services/McpService.ts`:

```typescript
// Old:
      if (response.status === 401) {
        this.initDeferredPromise.reject(new McpUnauthorizedError());
        return;
      }

// New:
      if (response.status === 401) {
        const wwwAuth = response.headers.get('www-authenticate') || undefined;
        this.initDeferredPromise.reject(new McpUnauthorizedError(undefined, wwwAuth));
        return;
      }
```

- [ ] **Step 3: Extract `WWW-Authenticate` header in `sendStreamableRequest`**

Replace lines 308-310 of `src/services/McpService.ts`:

```typescript
// Old:
        if (response.status === 401) {
          deferred.reject(new McpUnauthorizedError());
          return;
        }

// New:
        if (response.status === 401) {
          const wwwAuth = response.headers.get('www-authenticate') || undefined;
          deferred.reject(new McpUnauthorizedError(undefined, wwwAuth));
          return;
        }
```

- [ ] **Step 4: Fix `getMcpService()` cache to allow credential changes**

Replace lines 405-408 of `src/services/McpService.ts`:

```typescript
// Old:
  if (currentInstance && currentInstance.authCredentials !== authCredentials) {
    // We should avoid such situations as they may lead to unexpected behavior
    throw new Error('MCP service is already initialized at provided URL with different credentials');
  }

// New:
  if (currentInstance && currentInstance.authCredentials !== authCredentials) {
    currentInstance.closeConnection();
    currentInstance = new McpService(serverUri, authCredentials);
  }
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/services/McpService.ts
git commit -m "feat(mcp): enhance McpUnauthorizedError with WWW-Authenticate header; fix service cache"
```

---

### Task 4: Update `McpSpecPage` orchestration

**Files:**
- Modify: `src/pages/ApiSpec/McpSpecPage/McpSpecPage.tsx`

- [ ] **Step 1: Update imports**

Replace the import of `getMcpServerOAuthCredentials` from `mcp.ts` with `McpAuthService`:

```typescript
// Old:
import { getMcpServerOAuthCredentials } from '@/utils/mcp';

// New:
import { McpAuthService } from '@/services/McpAuthService';
```

- [ ] **Step 2: Update `determineAuthFlow` to use `McpAuthService`**

Replace the `determineAuthFlow` callback (lines 44-66):

```typescript
// Old:
  const determineAuthFlow = useCallback(async () => {
    if (!definitionId || !deployment || authState !== McpServerAuthState.NOT_AUTHORIZED) {
      return;
    }

    // Use dynamic registration flow if the server has this feature
    const mcpServerCredentials = await getMcpServerOAuthCredentials(deployment.server.runtimeUri[0]);
    if (mcpServerCredentials) {
      setMcpOAuthCredentials(mcpServerCredentials);
      setAuthState(McpServerAuthState.DYNAMIC_REGISTRATION_FLOW);
      return;
    }

    // Use API access flow if it was configured for this server
    const securityRequirements = await ApiService.getSecurityRequirements(definitionId);
    if (securityRequirements.length) {
      setAuthState(McpServerAuthState.API_ACCESS_FLOW);
      return;
    }

    // Otherwise, we can assume that the server is authorized
    setAuthState(McpServerAuthState.AUTHORIZED);
  }, [ApiService, authState, definitionId, deployment]);

// New:
  const determineAuthFlow = useCallback(async () => {
    if (!definitionId || !deployment || authState !== McpServerAuthState.NOT_AUTHORIZED) {
      return;
    }

    // Use dynamic registration flow if the server has this feature
    const mcpServerCredentials = await McpAuthService.discoverOAuthCredentials(deployment.server.runtimeUri[0]);
    if (mcpServerCredentials) {
      setMcpOAuthCredentials(mcpServerCredentials);
      setAuthState(McpServerAuthState.DYNAMIC_REGISTRATION_FLOW);
      return;
    }

    // Use API access flow if it was configured for this server
    const securityRequirements = await ApiService.getSecurityRequirements(definitionId);
    if (securityRequirements.length) {
      setAuthState(McpServerAuthState.API_ACCESS_FLOW);
      return;
    }

    // Otherwise, we can assume that the server is authorized
    setAuthState(McpServerAuthState.AUTHORIZED);
  }, [ApiService, authState, definitionId, deployment]);
```

- [ ] **Step 3: Update `makeApiSpec` error handler to attempt RFC 9728 discovery**

Replace the `makeApiSpec` callback (lines 80-107):

```typescript
// Old:
  const makeApiSpec = useCallback(async () => {
    if (!isAuthorized || !mcpService || !definition.data) {
      return;
    }

    try {
      setIsSpecLoading(true);
      setError(undefined);
      const spec = await mcpService.collectMcpSpec();
      const reader = await getSpecReader(spec, {
        ...definition.data,
        specification: {
          ...definition.data.specification,
          // TODO: this probably needs to be more robust
          name: 'mcp',
        },
      });
      setApiSpec(reader);
    } catch (err) {
      if (err instanceof McpUnauthorizedError) {
        setError('The MCP server requires authentication, but required configuration cannot be determined automatically.');
      } else {
        setError('Failed to connect to the MCP server. Please try again later.');
      }
    } finally {
      setIsSpecLoading(false);
    }
  }, [definition.data, isAuthorized, mcpService]);

// New:
  const makeApiSpec = useCallback(async () => {
    if (!isAuthorized || !mcpService || !definition.data) {
      return;
    }

    try {
      setIsSpecLoading(true);
      setError(undefined);
      const spec = await mcpService.collectMcpSpec();
      const reader = await getSpecReader(spec, {
        ...definition.data,
        specification: {
          ...definition.data.specification,
          // TODO: this probably needs to be more robust
          name: 'mcp',
        },
      });
      setApiSpec(reader);
    } catch (err) {
      if (err instanceof McpUnauthorizedError && err.wwwAuthenticate) {
        // Attempt RFC 9728 discovery from WWW-Authenticate header
        const serverUri = deployment.server.runtimeUri[0];
        const credentials = await McpAuthService.discoverFromWwwAuthenticate(err.wwwAuthenticate, serverUri);

        if (credentials) {
          // Clear existing state and switch to dynamic registration flow
          setApiSpec(undefined);
          setError(undefined);
          mcpService.closeConnection();
          setMcpOAuthCredentials(credentials);
          setAuthState(McpServerAuthState.DYNAMIC_REGISTRATION_FLOW);
          return;
        }

        setError('The MCP server requires authentication, but required configuration cannot be determined automatically.');
      } else if (err instanceof McpUnauthorizedError) {
        setError('The MCP server requires authentication, but required configuration cannot be determined automatically.');
      } else {
        setError('Failed to connect to the MCP server. Please try again later.');
      }
    } finally {
      setIsSpecLoading(false);
    }
  }, [definition.data, deployment, isAuthorized, mcpService]);
```

Note: `deployment` is added to the dependency array since we now use `deployment.server.runtimeUri[0]` inside the callback.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/ApiSpec/McpSpecPage/McpSpecPage.tsx
git commit -m "feat(mcp): update McpSpecPage to use McpAuthService with RFC 9728 fallback"
```

---

### Task 5: Remove old `getMcpServerOAuthCredentials` from `mcp.ts`

**Files:**
- Modify: `src/utils/mcp.ts`

- [ ] **Step 1: Remove the function and unused imports**

Replace the entire contents of `src/utils/mcp.ts` with only what remains needed. Since the file only contained `getMcpServerOAuthCredentials` and its helper, remove everything:

```typescript
// Old file (entire content removed — function moved to McpAuthService):
// import { McpServerAuthMetadata } from '@/types/mcp';
// import { Oauth2Credentials, OAuthGrantTypes } from '@/types/apiAuth';
// import { apimFetchProxy } from '@/utils/apimProxy';
// import { useCorsProxy } from '@/constants';
// ... entire file
```

If the file has no other exports, delete it entirely. If other code imports from `@/utils/mcp`, check for remaining exports first.

Run to check for other imports:
```bash
grep -r "from '@/utils/mcp'" src/ --include="*.ts" --include="*.tsx"
```

If only `McpSpecPage.tsx` imports from it (which was updated in Task 4), delete the file:

```bash
git rm src/utils/mcp.ts
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run linting**

Run: `npm run lint`
Expected: No new errors (pre-existing warnings are OK)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(mcp): remove old getMcpServerOAuthCredentials (moved to McpAuthService)"
```

---

### Task 6: Build verification and manual smoke test

**Files:** None (verification only)

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run linting**

Run: `npm run lint`
Expected: No new errors

- [ ] **Step 3: Commit all remaining changes (if any)**

```bash
git add -A
git status
# Only commit if there are changes
```
