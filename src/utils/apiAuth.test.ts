import { describe, expect, it } from 'vitest';
import { ApiAuthType, OAuthGrantTypes } from '@/types/apiAuth';
import { getApiKeyCredentials, getUsableOauthScheme, isUsableOauthScheme, MISSING_CREDENTIALS_ERROR } from './apiAuth';

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

describe('MISSING_CREDENTIALS_ERROR', () => {
  it('uses a stable message for omitted credentials', () => {
    expect(MISSING_CREDENTIALS_ERROR).toBe(
      'Credentials are unavailable for the current user. The request will be sent without authentication.'
    );
  });
});
