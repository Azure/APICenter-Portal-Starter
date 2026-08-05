import { describe, expect, it } from 'vitest';
import { ApiAuthType, OAuthGrantTypes } from '@/types/apiAuth';
import {
  getActiveOauthAuthState,
  getApiDefinitionKey,
  getApiKeyCredentials,
  getApiKeyQueryAuthState,
  getResolvedApiAuthScheme,
  getUsableOauthScheme,
  isUsableOauthScheme,
  MISSING_CREDENTIALS_ERROR,
} from './apiAuth';

describe('getApiDefinitionKey', () => {
  it('distinguishes definitions with the same auth scheme across resource types', () => {
    expect(
      getApiDefinitionKey({
        apiName: 'orders',
        versionName: 'v1',
        definitionName: 'openapi',
        resourceType: 'apis',
      })
    ).toBe('apis/orders/v1/openapi');

    expect(
      getApiDefinitionKey({
        apiName: 'orders',
        versionName: 'v1',
        definitionName: 'openapi',
        resourceType: 'models',
      })
    ).toBe('models/orders/v1/openapi');
  });
});

describe('getActiveOauthAuthState', () => {
  it('does not expose OAuth state owned by another definition', () => {
    expect(
      getActiveOauthAuthState('apis/orders/v1/openapi', 'oauth', {
        definitionKey: 'apis/inventory/v1/openapi',
        schemeName: 'oauth',
        credentials: {
          name: 'Authorization',
          value: 'token-for-inventory',
          in: 'header',
          createdAt: new Date(),
        },
        isAuthenticating: false,
      })
    ).toBeUndefined();
  });
});

describe('getApiKeyCredentials', () => {
  it('returns credentials only when every API-key field is present', () => {
    expect(
      getApiKeyCredentials({
        securityScheme: ApiAuthType.apiKey,
        apiKey: { name: 'X-API-Key', value: 'secret', in: 'header' },
      })
    ).toEqual({ name: 'X-API-Key', value: 'secret', in: 'header' });
  });

  it('returns undefined when a successful response omits the API key', () => {
    expect(getApiKeyCredentials({ securityScheme: ApiAuthType.apiKey })).toBeUndefined();
  });
});

describe('isUsableOauthScheme', () => {
  it('accepts a public OAuth configuration without a client secret', () => {
    expect(
      isUsableOauthScheme({
        securityScheme: ApiAuthType.oauth2,
        oauth2: {
          clientId: 'portal-client',
          authorizationUrl: 'https://login.example.test/authorize',
          tokenUrl: 'https://login.example.test/token',
          supportedScopes: ['openid'],
          supportedFlows: [OAuthGrantTypes.authorizationCodeWithPkce],
        },
      })
    ).toBe(true);
  });

  it('accepts an implicit-only OAuth configuration without a token endpoint', () => {
    expect(
      isUsableOauthScheme({
        securityScheme: ApiAuthType.oauth2,
        oauth2: {
          clientId: 'portal-client',
          authorizationUrl: 'https://login.example.test/authorize',
          supportedScopes: ['openid'],
          supportedFlows: [OAuthGrantTypes.implicit],
        },
      })
    ).toBe(true);
  });

  it('rejects a code-only OAuth configuration without a token endpoint', () => {
    expect(
      isUsableOauthScheme({
        securityScheme: ApiAuthType.oauth2,
        oauth2: {
          clientId: 'portal-client',
          authorizationUrl: 'https://login.example.test/authorize',
          supportedScopes: ['openid'],
          supportedFlows: [OAuthGrantTypes.authorizationCodeWithPkce],
        },
      })
    ).toBe(false);
  });

  it('rejects an OAuth response that omits required public configuration', () => {
    expect(
      isUsableOauthScheme({
        securityScheme: ApiAuthType.oauth2,
        oauth2: {
          authorizationUrl: 'https://login.example.test/authorize',
          tokenUrl: 'https://login.example.test/token',
          supportedScopes: ['openid'],
          supportedFlows: [OAuthGrantTypes.authorizationCodeWithPkce],
        },
      })
    ).toBe(false);
  });

  it('exposes only the implicit flow when mixed browser flows omit a token endpoint', () => {
    expect(
      getUsableOauthScheme({
        securityScheme: ApiAuthType.oauth2,
        oauth2: {
          clientId: 'portal-client',
          authorizationUrl: 'https://login.example.test/authorize',
          supportedScopes: ['openid'],
          supportedFlows: [
            OAuthGrantTypes.authorizationCode,
            OAuthGrantTypes.authorizationCodeWithPkce,
            OAuthGrantTypes.implicit,
          ],
        },
      })
    ).toEqual({
      securityScheme: ApiAuthType.oauth2,
      oauth2: {
        clientId: 'portal-client',
        authorizationUrl: 'https://login.example.test/authorize',
        supportedScopes: ['openid'],
        supportedFlows: [OAuthGrantTypes.implicit],
      },
    });
  });

  it('rejects OAuth flows that are unsupported by the browser client', () => {
    expect(
      isUsableOauthScheme({
        securityScheme: ApiAuthType.oauth2,
        oauth2: {
          clientId: 'portal-client',
          authorizationUrl: 'https://login.example.test/authorize',
          tokenUrl: 'https://login.example.test/token',
          supportedScopes: ['openid'],
          supportedFlows: ['client_credentials'],
        },
      })
    ).toBe(false);
  });
});

describe('getResolvedApiAuthScheme', () => {
  it('preserves a valid API-key response for cached query reuse', () => {
    const scheme = {
      securityScheme: ApiAuthType.apiKey,
      apiKey: { name: 'X-API-Key', value: 'secret', in: 'header' },
    } as const;

    expect(getResolvedApiAuthScheme(scheme)).toBe(scheme);
  });

  it('returns the explicit unavailable sentinel when an API-key response omits credentials', () => {
    expect(getResolvedApiAuthScheme({ securityScheme: ApiAuthType.apiKey })).toBeNull();
  });
});

describe('getApiKeyQueryAuthState', () => {
  const apiKeyScheme = {
    securityScheme: ApiAuthType.apiKey,
    apiKey: { name: 'X-API-Key', value: 'secret', in: 'header' },
  } as const;

  it('leaves credentials and errors undefined when no auth option is active', () => {
    expect(getApiKeyQueryAuthState(undefined, apiKeyScheme)).toEqual({});
    expect(getApiKeyQueryAuthState(undefined, null)).toEqual({});
  });

  it('derives API-key credentials from the active query result', () => {
    const authState = getApiKeyQueryAuthState('api-key', apiKeyScheme);

    expect(authState.authError).toBeUndefined();
    expect(authState.credentials).toMatchObject({
      name: 'X-API-Key',
      value: 'secret',
      in: 'header',
    });
    expect(authState.credentials?.createdAt).toBeInstanceOf(Date);
  });

  it('returns the unavailable-credentials error only for the active null sentinel', () => {
    expect(getApiKeyQueryAuthState('api-key', null)).toEqual({
      authError: MISSING_CREDENTIALS_ERROR,
    });
    expect(
      getApiKeyQueryAuthState('api-key', {
        securityScheme: ApiAuthType.oauth2,
        oauth2: {
          clientId: 'portal-client',
          authorizationUrl: 'https://login.example.test/authorize',
          supportedScopes: ['openid'],
          supportedFlows: [OAuthGrantTypes.implicit],
        },
      })
    ).toEqual({});
  });
});

describe('MISSING_CREDENTIALS_ERROR', () => {
  it('uses a stable message for omitted credentials', () => {
    expect(MISSING_CREDENTIALS_ERROR).toBe(
      'Credentials are unavailable for the current user. The request will be sent without authentication.'
    );
  });
});
