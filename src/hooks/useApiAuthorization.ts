import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiAuthCredentials, ApiAuthScheme, ApiAuthType, OAuthGrantTypes } from '@/types/apiAuth';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { OAuthService } from '@/services/OAuthService';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { QueryKeys } from '@/constants/QueryKeys';
import { getApiKeyQueryAuthState, getResolvedApiAuthScheme, isUsableOauthScheme } from '@/utils/apiAuth';

interface ReturnType {
  scheme?: ApiAuthScheme;
  credentials?: ApiAuthCredentials;
  authError?: string;
  isLoading: boolean;
  authenticateWithOauth: (oauthFlow: string) => Promise<void>;
}

interface Props {
  definitionId: ApiDefinitionId;
  schemeName?: string;
}

export function useApiAuthorization({ definitionId, schemeName }: Props): ReturnType {
  const [oauthCredentials, setOauthCredentials] = useState<ApiAuthCredentials | undefined>();
  const [oauthAuthError, setOauthAuthError] = useState<string | undefined>();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const activeSchemeNameRef = useRef<string | undefined>(schemeName);
  const oauthRequestIdRef = useRef(0);

  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);
  const hasActiveScheme = Boolean(isAuthenticated && definitionId.apiName && definitionId.versionName && schemeName);

  useEffect(() => {
    activeSchemeNameRef.current = schemeName;
    oauthRequestIdRef.current += 1;
    setOauthCredentials(undefined);
    setOauthAuthError(undefined);
    setIsAuthenticating(false);
  }, [isAuthenticated, schemeName]);

  const schemeQuery = useQuery<ApiAuthScheme | null>({
    queryKey: [QueryKeys.ApiAuthScheme, definitionId, schemeName],
    queryFn: async () => getResolvedApiAuthScheme(await ApiService.getSecurityCredentials(definitionId, schemeName)),
    staleTime: Infinity,
    enabled: hasActiveScheme,
  });

  const apiKeyQueryAuthState = useMemo(
    () => getApiKeyQueryAuthState(hasActiveScheme ? schemeName : undefined, schemeQuery.data),
    [hasActiveScheme, schemeName, schemeQuery.data]
  );

  const authenticateWithOauth = useCallback(
    async (oauthFlow: string) => {
      if (schemeQuery.isLoading) {
        return;
      }

      if (!isUsableOauthScheme(schemeQuery.data)) {
        return;
      }

      if (!Object.values(OAuthGrantTypes).includes(oauthFlow as OAuthGrantTypes)) {
        throw new Error(`Unsupported grant type: ${oauthFlow}`);
      }

      const activeSchemeName = schemeName;
      const requestId = oauthRequestIdRef.current + 1;
      oauthRequestIdRef.current = requestId;

      try {
        setOauthCredentials(undefined);
        setOauthAuthError(undefined);
        setIsAuthenticating(true);
        const token = await OAuthService.authenticate(schemeQuery.data.oauth2, oauthFlow as OAuthGrantTypes);

        if (oauthRequestIdRef.current !== requestId || activeSchemeNameRef.current !== activeSchemeName) {
          return;
        }

        if (token !== undefined) {
          setOauthCredentials({ name: 'Authorization', value: token, in: 'header', createdAt: new Date() });
        }
      } catch (e) {
        if (oauthRequestIdRef.current !== requestId || activeSchemeNameRef.current !== activeSchemeName) {
          return;
        }

        setOauthAuthError(e.message);
      } finally {
        if (oauthRequestIdRef.current === requestId && activeSchemeNameRef.current === activeSchemeName) {
          setIsAuthenticating(false);
        }
      }
    },
    [schemeName, schemeQuery.data, schemeQuery.isLoading]
  );

  const scheme = schemeQuery.data ?? undefined;

  return {
    scheme,
    credentials: scheme?.securityScheme === ApiAuthType.oauth2 ? oauthCredentials : apiKeyQueryAuthState.credentials,
    authError: scheme?.securityScheme === ApiAuthType.oauth2 ? oauthAuthError : apiKeyQueryAuthState.authError,
    isLoading: schemeQuery.isLoading || isAuthenticating,
    authenticateWithOauth,
  };
}
