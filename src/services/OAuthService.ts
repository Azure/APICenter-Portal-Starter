import ClientOAuth2 from 'client-oauth2';
import * as uuid from 'uuid';
import { capitalize } from 'lodash';
import { Oauth2Credentials, OAuthGrantTypes } from '@/types/apiAuth';
import { apimFetchProxy } from '@/utils/apimProxy';

export interface OAuthTokenResponse {
  /** Access token. */
  access_token: string;
  /** Type of the access token, e.g. `Bearer`. */
  token_type: string;
  /** Expiration date and time, e.g. `1663205603`. */
  expires_on: string;
  /** Base64-encoded ID token. */
  id_token: string;
  /** Refresh token. */
  refresh_token: string;
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateRandomString(length: number): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ensurePopupIsClosed(popup: Window, receiveMessage: (event: MessageEvent<any>) => any): Promise<void> {
  return new Promise((resolve) => {
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', receiveMessage, false);
        resolve();
      }
    }, 500);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function openAuthPopup(uri: string, listener: (event: MessageEvent<any>) => any): Promise<string | undefined> {
  return new Promise<string>(async (resolve, reject) => {
    try {
      let isComplete = false;
      const popup = window.open(uri, '_blank', 'width=400,height=500');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const receiveMessage = async (event: MessageEvent<any>): Promise<void> => {
        isComplete = true;
        try {
          const result = await listener(event);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          window.removeEventListener('message', listener, false);
        }
      };

      window.addEventListener('message', receiveMessage, false);
      await ensurePopupIsClosed(popup, receiveMessage);
      if (!isComplete) {
        resolve(undefined);
      }
    } catch (error) {
      reject(error);
    }
  });
}

export const OAuthService = {
  /** Acquires access token using specified grant flow. */
  // TODO: useProxy flag is added as a quick workaround for overcoming CORS issues for demo. Remove it when possible.
  authenticate(credentials: Oauth2Credentials, grantType: string, useProxy?: boolean): Promise<string | undefined> {
    const backendUrl = window.location.origin;

    try {
      switch (grantType) {
        case OAuthGrantTypes.implicit:
          return this.authenticateImplicit(backendUrl, credentials);

        case OAuthGrantTypes.authorizationCode:
        case OAuthGrantTypes.authorizationCodeWithPkce:
          return this.authenticateCodeWithPkce(backendUrl, credentials, useProxy);
      }
    } catch {
      throw new Error('Authentication failed');
    }
  },

  /** Acquires access token using "implicit" grant flow. */
  authenticateImplicit(backendUrl: string, credentials: Oauth2Credentials): Promise<string | undefined> {
    const query = {
      state: uuid.v4(),
    };

    if (credentials.supportedScopes.includes('openid')) {
      query['nonce'] = uuid.v4();
      query['response_type'] = 'id_token';
    }

    const oauthClient = new ClientOAuth2({
      clientId: credentials.clientId,
      accessTokenUri: credentials.tokenUrl,
      authorizationUri: credentials.authorizationUrl,
      redirectUri: backendUrl,
      scopes: credentials.supportedScopes,
      query: query,
    });

    const listener = async (event: MessageEvent): Promise<string> => {
      const tokenHash = event.data['uri'];

      if (!tokenHash) {
        return;
      }

      const tokenInfo = await oauthClient.token.getToken(backendUrl + tokenHash);

      if (tokenInfo.accessToken) {
        return `${capitalize(tokenInfo.tokenType)} ${tokenInfo.accessToken}`;
      } else if (tokenInfo.data?.id_token) {
        return `Bearer ${tokenInfo.data.id_token}`;
      }
    };

    return openAuthPopup(oauthClient.token.getUri(), listener);
  },

  async authenticateCodeWithPkce(
    backendUrl: string,
    credentials: Oauth2Credentials,
    useProxy?: boolean
  ): Promise<string | undefined> {
    const codeVerifier = generateRandomString(64);
    const challengeMethod = crypto.subtle ? 'S256' : 'plain';

    const codeChallenge = challengeMethod === 'S256' ? await generateCodeChallenge(codeVerifier) : codeVerifier;

    sessionStorage.setItem('code_verifier', codeVerifier);

    const args = new URLSearchParams({
      response_type: 'code',
      client_id: credentials.clientId,
      code_challenge_method: challengeMethod,
      code_challenge: codeChallenge,
      redirect_uri: backendUrl,
      scope: credentials.supportedScopes.join(' '),
    });

    const listener = async (event: MessageEvent): Promise<string> => {
      const authorizationCode = event.data['code'];

      if (!authorizationCode) {
        throw new Error('Authorization code is missing');
      }

      const body = new URLSearchParams({
        client_id: credentials.clientId,
        code_verifier: sessionStorage.getItem('code_verifier'),
        grant_type: OAuthGrantTypes.authorizationCode,
        redirect_uri: backendUrl,
        code: authorizationCode,
      });

      const fetchImpl = useProxy ? apimFetchProxy : fetch;

      const response = await fetchImpl(credentials.tokenUrl, {
        method: 'POST',
        body: body.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 400) {
        throw new Error(await response.text());
      }

      const tokenResponse = (await response.json()) as OAuthTokenResponse;

      return `${capitalize(tokenResponse.token_type)} ${tokenResponse.access_token}`;
    };

    return openAuthPopup(`${credentials.authorizationUrl}?${args}`, listener);
  },
};
