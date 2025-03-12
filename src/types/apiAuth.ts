export enum OAuthGrantTypes {
  /**
   * The Implicit flow was a simplified OAuth flow previously recommended for native apps and
   * JavaScript apps where the access token was returned immediately without an extra
   * authorization code exchange step.
   */
  implicit = 'implicit',

  /**
   * The Authorization Code grant type is used by confidential and public clients to exchange
   * an authorization code for an access token.
   */
  authorizationCode = 'authorization_code',

  /**
   * Proof Key for Code Exchange (abbreviated PKCE) is an extension to the authorization code
   * flow to prevent CSRF and authorization code injection attacks.
   */
  authorizationCodeWithPkce = 'authorization_code (PKCE)',

  /**
   * The Client Credentials grant type is used by clients to obtain an access token outside of
   * the context of a user.
   */
  clientCredentials = 'client_credentials',

  /**
   * The Resource owner password grant type is used to exchange a username and password for an access
   * token directly.
   */
  password = 'password',
}

export enum ApiAuthType {
  oauth2 = 'oauth2',
  apiKey = 'apiKey',
}

export interface ApiAuthCredentials {
  value: string;
  name: string;
  in: 'header' | 'query';
}

export interface Oauth2Credentials {
  clientId: string;
  authorizationUrl: string;
  tokenUrl: string;
  supportedScopes: string[];
  supportedFlows: OAuthGrantTypes[];
}

export interface ApiAuthSchemeMetadata {
  description: string;
  name: string;
  securityScheme: ApiAuthType;
  title: string;
}

export interface ApiKeyScheme {
  securityScheme: ApiAuthType.apiKey;
  apiKey: ApiAuthCredentials;
}

export interface Oauth2Scheme {
  securityScheme: ApiAuthType.oauth2;
  oauth2: Oauth2Credentials;
}

export type ApiAuthScheme = ApiKeyScheme | Oauth2Scheme;
