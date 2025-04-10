import { McpServerAuthMetadata } from '@/types/mcp';
import { Oauth2Credentials, OAuthGrantTypes } from '@/types/apiAuth';
import { apimFetchProxy } from '@/utils/apimProxy';

export async function getMcpServerOAuthCredentials(serverUri: string): Promise<Oauth2Credentials | undefined> {
  const origin = new URL(serverUri).origin;

  const metadataResponse = await apimFetchProxy(`${origin}/.well-known/oauth-authorization-server`, {
    method: 'GET',
  });

  let metadata: McpServerAuthMetadata | undefined;
  if (metadataResponse.ok) {
    metadata = await metadataResponse.json();
  } else {
    metadata = {
      issuer: origin,
      authorization_endpoint: `${origin}/authorize`,
      token_endpoint: `${origin}/token`,
      registration_endpoint: `${origin}/register`,
      jwks_uri: `${origin}/jwks`,
      scopes_supported: ['openid', 'profile', 'email'],
      response_types_supported: ['code', 'token'],
      grant_types_supported: [OAuthGrantTypes.authorizationCode],
    };
  }

  const registrationResponse = await apimFetchProxy(metadata.registration_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_name: 'APIC MCP Inspector',
      redirect_uris: [window.location.origin],
      response_types: ['code'],
      grant_types: metadata.grant_types_supported,
      token_endpoint_auth_method: 'client_secret_basic',
    }),
  });

  if (registrationResponse.ok) {
    const { client_id } = await registrationResponse.json();

    return {
      clientId: client_id,
      authorizationUrl: metadata.authorization_endpoint,
      tokenUrl: metadata.token_endpoint,
      supportedScopes: metadata.scopes_supported,
      supportedFlows: metadata.grant_types_supported,
    };
  }

  return undefined;
}
