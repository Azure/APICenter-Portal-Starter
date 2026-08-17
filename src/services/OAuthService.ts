import ClientOAuth2 from 'client-oauth2';
import * as uuid from 'uuid';
import { capitalize } from 'lodash';
import { Oauth2Credentials, OAuthGrantTypes } from '@/types/apiAuth';
import { apimFetchProxy } from '@/utils/apimProxy';
import { issueOAuthState, releaseOAuthState } from '@/utils/oauthState';

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

/** Payload posted back by the OAuth callback bridge in `index.html`. */
export interface OAuthCallbackPayload {
  /** Authorization code, for the authorization code (PKCE) flow. */
  code?: string;
  /** Opaque value echoed back by the authorization server. */
  state?: string;
  /** OAuth error code, e.g. `access_denied`. */
  error?: string;
  /** Human readable description of the OAuth error. */
  error_description?: string;
  /** Raw fragment (or query string) carrying implicit flow tokens. */
  uri?: string;
}

/** How long to wait for the authorization popup to report a result before giving up. */
const AUTH_POPUP_TIMEOUT_MS = 5 * 60 * 1000;

/** How often to check whether the user dismissed the authorization popup. */
const POPUP_CLOSE_POLL_INTERVAL_MS = 500;

/** Grace period after the popup disappears, to let an in-flight callback message land. */
const POPUP_CLOSE_GRACE_MS = 1000;

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

/** Ensures a `message` event actually comes from our own OAuth callback bridge. */
function isOAuthCallbackMessage(event: MessageEvent): boolean {
  if (event.origin !== window.location.origin) {
    return false;
  }

  const data = event.data as OAuthCallbackPayload | undefined;

  return Boolean(data && typeof data === 'object' && (data.code || data.error || data.uri));
}

/**
 * Only http(s) URLs may be handed to `window.open`. Authorization endpoints ultimately
 * originate from a publisher-controlled OAuth discovery document, so a dangerous scheme such
 * as `javascript:`, `data:`, `blob:`, or `vbscript:` would execute in the portal's own origin
 * (stored XSS). This is a defense-in-depth guard in addition to endpoint validation performed
 * during OAuth discovery.
 */
function validateUriScheme(uri: string): boolean {
  try {
    const { protocol } = new URL(uri);

    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Opens the authorization popup and resolves with the token produced by `listener` once the
 * callback bridge reports back. Resolves with `undefined` if the user dismisses the popup.
 */
function openAuthPopup(
  uri: string,
  expectedState: string,
  listener: (payload: OAuthCallbackPayload) => Promise<string | undefined>
): Promise<string | undefined> {
  return new Promise<string | undefined>((resolve, reject) => {
    if (!validateUriScheme(uri)) {
      releaseOAuthState(expectedState);
      reject(new Error('The authorization endpoint uses an unsupported URL scheme and was blocked.'));
      return;
    }

    const popup = window.open(uri, '_blank', 'width=400,height=500');

    if (!popup) {
      releaseOAuthState(expectedState);
      reject(new Error('Unable to open the sign-in window. Allow pop-ups for this site and try again.'));
      return;
    }

    let isSettled = false;

    const cleanUp = (): void => {
      isSettled = true;
      releaseOAuthState(expectedState);
      window.removeEventListener('message', receiveMessage, false);
      clearInterval(closePollTimer);
      clearTimeout(timeoutTimer);
    };

    const closePopup = (): void => {
      try {
        popup.close();
      } catch {
        // The popup may already be gone - nothing to do.
      }
    };

    const receiveMessage = (event: MessageEvent): void => {
      if (isSettled || !isOAuthCallbackMessage(event)) {
        return;
      }

      const payload = event.data as OAuthCallbackPayload;

      // Every in-flight authentication attempt listens on the same window, and a single callback
      // is delivered to all of them. A response carrying a different `state` belongs to another
      // attempt, so ignore it silently rather than failing this one. Providers that drop `state`
      // altogether are still accepted - `event.origin` above is the guard that matters, and the
      // PKCE code verifier binds the code to this session.
      if (payload.state && payload.state !== expectedState) {
        return;
      }

      cleanUp();
      closePopup();

      if (payload.error) {
        reject(new Error(payload.error_description || payload.error));
        return;
      }

      listener(payload).then(resolve, reject);
    };

    window.addEventListener('message', receiveMessage, false);

    const closePollTimer = setInterval(() => {
      if (isSettled || !popup.closed) {
        return;
      }

      // The bridge posts its message and only then closes itself, so a successful callback can
      // race this poll. Give the pending message a chance to arrive before reporting a dismissal.
      clearInterval(closePollTimer);
      setTimeout(() => {
        if (isSettled) {
          return;
        }

        cleanUp();
        resolve(undefined);
      }, POPUP_CLOSE_GRACE_MS);
    }, POPUP_CLOSE_POLL_INTERVAL_MS);

    const timeoutTimer = setTimeout(() => {
      if (isSettled) {
        return;
      }

      cleanUp();
      closePopup();
      reject(new Error('Authentication timed out before the authorization server responded. Please try again.'));
    }, AUTH_POPUP_TIMEOUT_MS);
  });
}

export const OAuthService = {
  /** Acquires access token using specified grant flow. */
  // TODO: useProxy flag is added as a quick workaround for overcoming CORS issues for demo. Remove it when possible.
  authenticate(credentials: Oauth2Credentials, grantType: string, useProxy?: boolean): Promise<string | undefined> {
    const backendUrl = window.location.origin;

    switch (grantType) {
      case OAuthGrantTypes.implicit:
        return this.authenticateImplicit(backendUrl, credentials);

      case OAuthGrantTypes.authorizationCode:
      case OAuthGrantTypes.authorizationCodeWithPkce:
        return this.authenticateCodeWithPkce(backendUrl, credentials, useProxy);

      default:
        throw new Error(`Unsupported grant type: ${grantType}`);
    }
  },

  /** Acquires access token using "implicit" grant flow. */
  authenticateImplicit(backendUrl: string, credentials: Oauth2Credentials): Promise<string | undefined> {
    const state = issueOAuthState();

    const query = {
      state,
      // Implicit responses are always returned in the fragment, but ask for it explicitly so a
      // provider that would otherwise default to `query` cannot put an access token in a
      // server-visible URL, where it would end up in request logs.
      response_mode: 'fragment',
    };

    if (credentials.supportedScopes.includes('openid')) {
      query['nonce'] = uuid.v4();
      query['response_type'] = 'id_token';
    }

    const oauthClient = new ClientOAuth2({
      clientId: credentials.clientId,
      authorizationUri: credentials.authorizationUrl,
      redirectUri: backendUrl,
      scopes: credentials.supportedScopes,
      // `state` is passed through `query` rather than as a top-level option on purpose. As a
      // top-level option `client-oauth2` would reject any response that does not echo `state`
      // back, which would break providers that omit it. `openAuthPopup` is therefore the only
      // place that checks `state`.
      query: query,
    });

    const listener = async (payload: OAuthCallbackPayload): Promise<string | undefined> => {
      const tokenHash = payload.uri;

      if (!tokenHash) {
        throw new Error('Authentication response did not contain a token');
      }

      const tokenInfo = await oauthClient.token.getToken(backendUrl + tokenHash);

      if (tokenInfo.accessToken) {
        return `${capitalize(tokenInfo.tokenType)} ${tokenInfo.accessToken}`;
      } else if (tokenInfo.data?.id_token) {
        return `Bearer ${tokenInfo.data.id_token}`;
      }
    };

    return openAuthPopup(oauthClient.token.getUri(), state, listener);
  },

  async authenticateCodeWithPkce(
    backendUrl: string,
    credentials: Oauth2Credentials,
    useProxy?: boolean
  ): Promise<string | undefined> {
    if (!credentials.tokenUrl) {
      throw new Error('Authentication configuration does not include a token endpoint.');
    }

    const codeVerifier = generateRandomString(64);
    const challengeMethod = crypto.subtle ? 'S256' : 'plain';
    const state = issueOAuthState();

    const codeChallenge = challengeMethod === 'S256' ? await generateCodeChallenge(codeVerifier) : codeVerifier;

    sessionStorage.setItem('code_verifier', codeVerifier);

    const args = new URLSearchParams({
      response_type: 'code',
      // Return the code in the URL fragment instead of the query string. Fragments are never sent
      // to the server, so long authorization codes cannot be rejected by server-side URL or query
      // string length limits. Providers that do not implement `response_mode` simply ignore it and
      // the callback bridge falls back to the query string.
      response_mode: 'fragment',
      client_id: credentials.clientId,
      code_challenge_method: challengeMethod,
      code_challenge: codeChallenge,
      redirect_uri: backendUrl,
      scope: credentials.supportedScopes.join(' '),
      state,
    });

    const listener = async (payload: OAuthCallbackPayload): Promise<string> => {
      const authorizationCode = payload.code;

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

    return openAuthPopup(`${credentials.authorizationUrl}?${args}`, state, listener);
  },
};
