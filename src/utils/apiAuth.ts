import { ApiAuthCredentials, ApiAuthScheme, ApiAuthType, OAuthGrantTypes, Oauth2Scheme } from '@/types/apiAuth';
import { ApiDefinitionId } from '@/types/apiDefinition';

type ApiKeyCredentials = Omit<ApiAuthCredentials, 'createdAt'>;

interface QueryDerivedApiAuthState {
  credentials?: ApiAuthCredentials;
  authError?: string;
}

export interface OauthAuthState {
  definitionKey: string;
  schemeName?: string;
  credentials?: ApiAuthCredentials;
  authError?: string;
  isAuthenticating: boolean;
}

export const MISSING_CREDENTIALS_ERROR =
  'Credentials are unavailable for the current user. The request will be sent without authentication.';

/**
 * Builds a stable identity for state that belongs to one API definition.
 *
 * @param definitionId - The API definition whose authorization state is being tracked.
 * @returns A stable definition identity including its resource type.
 */
export function getApiDefinitionKey({
  apiName,
  versionName,
  definitionName,
  resourceType = 'apis',
}: ApiDefinitionId): string {
  return [resourceType, apiName, versionName, definitionName].join('/');
}

/**
 * Returns OAuth state only when it belongs to the currently rendered definition and auth option.
 *
 * @param definitionKey - The definition currently rendered by the authorization form.
 * @param schemeName - The authentication scheme currently selected by the user.
 * @param oauthState - Transient OAuth state from a pending or completed authentication flow.
 * @returns OAuth state for the active authorization context, or `undefined` when it is stale.
 */
export function getActiveOauthAuthState(
  definitionKey: string,
  schemeName: string | undefined,
  oauthState: OauthAuthState | undefined
): OauthAuthState | undefined {
  return oauthState?.definitionKey === definitionKey && oauthState.schemeName === schemeName ? oauthState : undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

const supportedBrowserFlows = [
  OAuthGrantTypes.implicit,
  OAuthGrantTypes.authorizationCode,
  OAuthGrantTypes.authorizationCodeWithPkce,
];

function getUsableBrowserFlows(supportedFlows: unknown, tokenUrl: unknown): OAuthGrantTypes[] | undefined {
  if (!Array.isArray(supportedFlows) || supportedFlows.length === 0 || !supportedFlows.every(isNonEmptyString)) {
    return undefined;
  }

  const hasTokenUrl = isNonEmptyString(tokenUrl);

  const usableFlows = supportedFlows.filter((flow, index, flows): flow is OAuthGrantTypes => {
    if (!supportedBrowserFlows.includes(flow as OAuthGrantTypes) || flows.indexOf(flow) !== index) {
      return false;
    }

    return flow === OAuthGrantTypes.implicit || hasTokenUrl;
  });

  return usableFlows.length > 0 ? usableFlows : undefined;
}

export function getApiKeyCredentials(scheme: unknown): ApiKeyCredentials | undefined {
  if (typeof scheme !== 'object' || scheme === null) {
    return undefined;
  }

  const candidate = scheme as {
    securityScheme?: unknown;
    apiKey?: { name?: unknown; value?: unknown; in?: unknown };
  };

  if (
    candidate.securityScheme !== ApiAuthType.apiKey ||
    !isNonEmptyString(candidate.apiKey?.name) ||
    !isNonEmptyString(candidate.apiKey?.value) ||
    (candidate.apiKey?.in !== 'header' && candidate.apiKey?.in !== 'query')
  ) {
    return undefined;
  }

  return {
    name: candidate.apiKey.name,
    value: candidate.apiKey.value,
    in: candidate.apiKey.in,
  };
}

export function getResolvedApiAuthScheme(scheme: unknown): ApiAuthScheme | null {
  if (getApiKeyCredentials(scheme)) {
    return scheme as ApiAuthScheme;
  }

  return getUsableOauthScheme(scheme) ?? null;
}

export function getApiKeyQueryAuthState(schemeName: string | undefined, scheme: unknown): QueryDerivedApiAuthState {
  if (!schemeName) {
    return {};
  }

  const apiKey = getApiKeyCredentials(scheme);
  if (apiKey) {
    return {
      credentials: {
        ...apiKey,
        createdAt: new Date(),
      },
    };
  }

  return scheme === null ? { authError: MISSING_CREDENTIALS_ERROR } : {};
}

export function isUsableOauthScheme(scheme: unknown): scheme is Oauth2Scheme {
  return getUsableOauthScheme(scheme) !== undefined;
}

export function getUsableOauthScheme(scheme: unknown): Oauth2Scheme | undefined {
  if (typeof scheme !== 'object' || scheme === null) {
    return undefined;
  }

  const candidate = scheme as {
    securityScheme?: unknown;
    oauth2?: {
      clientId?: unknown;
      authorizationUrl?: unknown;
      tokenUrl?: unknown;
      supportedScopes?: unknown;
      supportedFlows?: unknown;
    };
  };

  const usableFlows = getUsableBrowserFlows(candidate.oauth2?.supportedFlows, candidate.oauth2?.tokenUrl);
  if (
    candidate.securityScheme !== ApiAuthType.oauth2 ||
    !isNonEmptyString(candidate.oauth2?.clientId) ||
    !isNonEmptyString(candidate.oauth2?.authorizationUrl) ||
    !Array.isArray(candidate.oauth2?.supportedScopes) ||
    !candidate.oauth2.supportedScopes.every(isNonEmptyString) ||
    !usableFlows
  ) {
    return undefined;
  }

  return {
    securityScheme: ApiAuthType.oauth2,
    oauth2: {
      clientId: candidate.oauth2.clientId,
      authorizationUrl: candidate.oauth2.authorizationUrl,
      ...(isNonEmptyString(candidate.oauth2.tokenUrl) ? { tokenUrl: candidate.oauth2.tokenUrl } : {}),
      supportedScopes: candidate.oauth2.supportedScopes,
      supportedFlows: usableFlows,
    },
  };
}
