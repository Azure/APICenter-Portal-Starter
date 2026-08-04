import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiAuthCredentials, ApiAuthScheme, ApiAuthType, OAuthGrantTypes } from '@/types/apiAuth';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { OAuthService } from '@/services/OAuthService';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { QueryKeys } from '@/constants/QueryKeys';
import {
  getApiKeyCredentials,
  getUsableOauthScheme,
  isUsableOauthScheme,
  MISSING_CREDENTIALS_ERROR,
} from '@/utils/apiAuth';

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
  const [credentials, setCredentials] = useState<ApiAuthCredentials | undefined>();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string>(undefined);

  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  useEffect(() => {
    if (isAuthenticated && schemeName) {
      return;
    }

    setCredentials(undefined);
    setAuthError(undefined);
  }, [isAuthenticated, schemeName]);

  const schemeQuery = useQuery<ApiAuthScheme | undefined>({
    queryKey: [QueryKeys.ApiAuthScheme, definitionId, schemeName],
    queryFn: async () => {
      setCredentials(undefined);
      setAuthError(undefined);

      const scheme = await ApiService.getSecurityCredentials(definitionId, schemeName);

      if (scheme?.securityScheme === ApiAuthType.apiKey) {
        const apiKey = getApiKeyCredentials(scheme);
        if (!apiKey) {
          setAuthError(MISSING_CREDENTIALS_ERROR);
          return undefined;
        }

        setCredentials({ ...apiKey, createdAt: new Date() });
        return scheme;
      }

      const oauthScheme = getUsableOauthScheme(scheme);
      if (oauthScheme) {
        return oauthScheme;
      }

      setAuthError(MISSING_CREDENTIALS_ERROR);
      return undefined;
    },
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && definitionId.apiName && definitionId.versionName && schemeName),
  });

  const authenticateWithOauth = useCallback(
    async (oauthFlow: string) => {
      if (schemeQuery.isLoading) {
        return;
      }

      if (!isUsableOauthScheme(schemeQuery.data)) {
        setCredentials(undefined);
        setAuthError(MISSING_CREDENTIALS_ERROR);
        return;
      }

      if (!Object.values(OAuthGrantTypes).includes(oauthFlow as OAuthGrantTypes)) {
        throw new Error(`Unsupported grant type: ${oauthFlow}`);
      }

      try {
        setCredentials(undefined);
        setAuthError(undefined);
        setIsAuthenticating(true);
        const token = await OAuthService.authenticate(schemeQuery.data.oauth2, oauthFlow as OAuthGrantTypes);
        if (token !== undefined) {
          setCredentials({ name: 'Authorization', value: token, in: 'header', createdAt: new Date() });
        }
      } catch (e) {
        setAuthError(e.message);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [schemeQuery]
  );

  return {
    scheme: schemeQuery.data,
    credentials,
    authError,
    isLoading: schemeQuery.isLoading || isAuthenticating,
    authenticateWithOauth,
  };
}
