import { useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiAuthCredentials, ApiAuthScheme, ApiAuthType, OAuthGrantTypes } from '@/types/apiAuth';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { OAuthService } from '@/services/OAuthService';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { QueryKeys } from '@/constants/QueryKeys';

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

  const schemeQuery = useQuery<ApiAuthScheme | undefined>({
    queryKey: [QueryKeys.ApiAuthScheme, definitionId, schemeName],
    queryFn: async () => {
      const scheme = await ApiService.getSecurityCredentials(definitionId, schemeName);
      if (scheme?.securityScheme === ApiAuthType.apiKey) {
        setCredentials({ ...scheme.apiKey, createdAt: new Date() });
      }
      return scheme;
    },
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && definitionId.apiName && definitionId.versionName && schemeName),
  });

  const authenticateWithOauth = useCallback(
    async (oauthFlow: string) => {
      if (schemeQuery.isLoading) {
        return;
      }

      if (schemeQuery.data?.securityScheme !== ApiAuthType.oauth2) {
        throw new Error('Currently selected scheme is not OAuth2');
      }

      if (!OAuthGrantTypes[oauthFlow]) {
        throw new Error(`Unsupported grant type: ${oauthFlow}`);
      }

      try {
        setCredentials(undefined);
        setIsAuthenticating(true);
        const token = await OAuthService.authenticate(schemeQuery.data.oauth2, OAuthGrantTypes[oauthFlow]);
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
