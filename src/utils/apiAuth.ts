import { ApiAuthCredentials, ApiAuthType, OAuthGrantTypes, Oauth2Scheme } from '@/types/apiAuth';

type ApiKeyCredentials = Omit<ApiAuthCredentials, 'createdAt'>;

export const MISSING_CREDENTIALS_ERROR =
  'Credentials are unavailable for the current user. The request will be sent without authentication.';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

const supportedBrowserFlows = [
  OAuthGrantTypes.implicit,
  OAuthGrantTypes.authorizationCode,
  OAuthGrantTypes.authorizationCodeWithPkce,
];

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

export function isUsableOauthScheme(scheme: unknown): scheme is Oauth2Scheme {
  if (typeof scheme !== 'object' || scheme === null) {
    return false;
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

  return (
    candidate.securityScheme === ApiAuthType.oauth2 &&
    isNonEmptyString(candidate.oauth2?.clientId) &&
    isNonEmptyString(candidate.oauth2?.authorizationUrl) &&
    isNonEmptyString(candidate.oauth2?.tokenUrl) &&
    Array.isArray(candidate.oauth2?.supportedScopes) &&
    candidate.oauth2.supportedScopes.every(isNonEmptyString) &&
    Array.isArray(candidate.oauth2?.supportedFlows) &&
    candidate.oauth2.supportedFlows.length > 0 &&
    candidate.oauth2.supportedFlows.every(isNonEmptyString) &&
    candidate.oauth2.supportedFlows.some((flow) => supportedBrowserFlows.includes(flow as OAuthGrantTypes))
  );
}
