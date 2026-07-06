import { McpServerAuthMetadata, McpProtectedResourceMetadata, McpDiscoveredAuth } from '@/types/mcp';
import { Oauth2Credentials } from '@/types/apiAuth';
import { apimFetchProxy } from '@/utils/apimProxy';
import { getMcpCorsProxyEnabled } from '@/constants';

function mcpFetch(url: string, requestInit?: RequestInit): ReturnType<typeof fetch> {
  if (!getMcpCorsProxyEnabled()) {
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

    // Reject private IPv4 ranges
    if (/^10\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) || /^192\.168\./.test(hostname)) {
      return false;
    }

    // Reject private IPv6 ranges (unique local fc00::/7 and link-local fe80::/10)
    const bare = hostname.replace(/^\[|\]$/g, '');
    if (/^fe80:/i.test(bare) || /^f[cd][0-9a-f]{2}:/i.test(bare)) {
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
export function validateResourceMetadata(metadata: McpProtectedResourceMetadata, serverUri: string): boolean {
  try {
    const resourceUrl = new URL(metadata.resource);
    const serverUrl = new URL(serverUri);
    return resourceUrl.origin === serverUrl.origin;
  } catch {
    return false;
  }
}

/**
 * Builds the ordered list of protected-resource metadata URLs to try for an MCP server URI.
 *
 * RFC 9728 places the well-known segment between host and the resource path
 * (e.g. https://svc.azure-api.net/myapi/mcp ->
 *  https://svc.azure-api.net/.well-known/oauth-protected-resource/myapi/mcp),
 * with a fallback to the root-level metadata document.
 */
function protectedResourceMetadataCandidates(serverUri: string): string[] {
  const url = new URL(serverUri);
  const path = url.pathname.replace(/\/$/, '');

  const root = `${url.origin}/.well-known/oauth-protected-resource`;
  if (!path) {
    return [root];
  }

  return [`${url.origin}/.well-known/oauth-protected-resource${path}`, root];
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

/**
 * Builds the ordered list of authorization-server metadata URLs to try for an issuer.
 *
 * RFC 8414 §3.1 requires the well-known segment to be INSERTED between host and path
 * (e.g. issuer https://host/tenant1 -> https://host/.well-known/oauth-authorization-server/tenant1).
 * The appended OpenID Connect form is kept only as a Microsoft Entra compatibility fallback.
 */
function authServerMetadataCandidates(issuer: string): string[] {
  const url = new URL(issuer);
  const path = url.pathname.replace(/\/$/, '');

  const candidates = [
    `${url.origin}/.well-known/oauth-authorization-server${path}`,
    `${url.origin}/.well-known/openid-configuration${path}`,
  ];

  if (path) {
    // Entra serves OIDC metadata at the appended location; keep as fallback.
    candidates.push(`${url.origin}${path}/.well-known/openid-configuration`);
  }

  return [...new Set(candidates)];
}

async function fetchAuthServerMetadata(issuer: string): Promise<McpServerAuthMetadata | undefined> {
  try {
    if (!validateMetadataUrl(issuer)) {
      console.warn(`Issuer URL failed validation: ${issuer}`);
      return undefined;
    }

    for (const metadataUrl of authServerMetadataCandidates(issuer)) {
      if (!validateMetadataUrl(metadataUrl)) {
        continue;
      }

      const response = await mcpFetch(metadataUrl, { method: 'GET' });
      if (response.ok) {
        return await response.json();
      }
    }

    console.warn(`Failed to fetch auth server metadata for issuer: ${issuer}`);
    return undefined;
  } catch (err) {
    console.warn('Failed to fetch auth server metadata:', err);
    return undefined;
  }
}

async function registerClient(metadata: McpServerAuthMetadata): Promise<Oauth2Credentials | undefined> {
  try {
    if (!metadata.registration_endpoint) {
      console.warn('Auth server does not support dynamic client registration (no registration_endpoint).');
      return undefined;
    }

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
   * Proactive discovery per RFC 9728: tries path-aware protected-resource metadata
   * (with root fallback), follows the first authorization server, fetches its metadata
   * (RFC 8414), and performs dynamic client registration.
   *
   * Returns undefined when the server does not expose discoverable, dynamically
   * registrable OAuth — the reactive 401 / WWW-Authenticate flow handles those servers.
   */
  async discoverOAuthCredentials(serverUri: string): Promise<Oauth2Credentials | undefined> {
    try {
      for (const metadataUrl of protectedResourceMetadataCandidates(serverUri)) {
        if (!validateMetadataUrl(metadataUrl)) {
          continue;
        }

        const resourceMetadata = await fetchResourceMetadata(metadataUrl);
        if (!resourceMetadata) {
          continue;
        }

        if (!validateResourceMetadata(resourceMetadata, serverUri)) {
          continue;
        }

        const issuer = resourceMetadata.authorization_servers?.[0];
        if (!issuer) {
          continue;
        }

        const authServerMetadata = await fetchAuthServerMetadata(issuer);
        if (!authServerMetadata) {
          continue;
        }

        return registerClient(authServerMetadata);
      }

      return undefined;
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
  ): Promise<Oauth2Credentials | McpDiscoveredAuth | undefined> {
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

      // 7. Try dynamic client registration; fall back to MSAL discovery
      const registered = await registerClient(authServerMetadata);
      if (registered) {
        return registered;
      }

      // No dynamic registration — return discovered auth for MSAL flow
      const scopes = resourceMetadata.scopes_supported ?? [];
      if (scopes.length === 0) {
        console.warn('No scopes_supported in resource metadata for MSAL fallback');
        return undefined;
      }

      return {
        type: 'msal',
        authority: issuer,
        scopes,
      };
    } catch (err) {
      console.warn('RFC 9728 discovery failed:', err);
      return undefined;
    }
  },
};
