import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiAuthCredentials, ApiAuthScheme, ApiAuthType, OAuthGrantTypes } from '@/types/apiAuth';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { OAuthService } from '@/services/OAuthService';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { QueryKeys } from '@/constants/QueryKeys';
import {
  getApiDefinitionKey,
  getActiveOauthAuthState,
  getApiKeyQueryAuthState,
  getResolvedApiAuthScheme,
  isUsableOauthScheme,
  OauthAuthState,
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
  const activeDefinitionKey = getApiDefinitionKey(definitionId);
  const [oauthState, setOauthState] = useState<OauthAuthState>({
    definitionKey: activeDefinitionKey,
    schemeName,
    isAuthenticating: false,
  });
  const activeSchemeNameRef = useRef<string | undefined>(schemeName);
  const activeDefinitionKeyRef = useRef(activeDefinitionKey);
  const oauthRequestIdRef = useRef(0);

  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);
  const hasActiveScheme = Boolean(isAuthenticated && definitionId.apiName && definitionId.versionName && schemeName);

  useEffect(() => {
    activeSchemeNameRef.current = schemeName;
    activeDefinitionKeyRef.current = activeDefinitionKey;
    oauthRequestIdRef.current += 1;
    setOauthState({
      definitionKey: activeDefinitionKey,
      schemeName,
      isAuthenticating: false,
    });
  }, [activeDefinitionKey, isAuthenticated, schemeName]);

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
      const definitionKey = activeDefinitionKey;
      const requestId = oauthRequestIdRef.current + 1;
      oauthRequestIdRef.current = requestId;
      const isActiveOauthRequest = (): boolean =>
        oauthRequestIdRef.current === requestId &&
        activeSchemeNameRef.current === activeSchemeName &&
        activeDefinitionKeyRef.current === definitionKey;

      try {
        setOauthState({
          definitionKey,
          schemeName: activeSchemeName,
          isAuthenticating: true,
        });
        const token = await OAuthService.authenticate(schemeQuery.data.oauth2, oauthFlow as OAuthGrantTypes);

        if (!isActiveOauthRequest()) {
          return;
        }

        if (token !== undefined) {
          setOauthState({
            definitionKey,
            schemeName: activeSchemeName,
            credentials: { name: 'Authorization', value: token, in: 'header', createdAt: new Date() },
            isAuthenticating: true,
          });
        }
      } catch (e) {
        if (!isActiveOauthRequest()) {
          return;
        }

        setOauthState({
          definitionKey,
          schemeName: activeSchemeName,
          authError: e.message,
          isAuthenticating: true,
        });
      } finally {
        if (isActiveOauthRequest()) {
          setOauthState((currentState) => ({
            ...currentState,
            isAuthenticating: false,
          }));
        }
      }
    },
    [activeDefinitionKey, schemeName, schemeQuery.data, schemeQuery.isLoading]
  );

  const scheme = schemeQuery.data ?? undefined;
  const activeOauthState = getActiveOauthAuthState(activeDefinitionKey, schemeName, oauthState);

  return {
    scheme,
    credentials:
      scheme?.securityScheme === ApiAuthType.oauth2 ? activeOauthState?.credentials : apiKeyQueryAuthState.credentials,
    authError:
      scheme?.securityScheme === ApiAuthType.oauth2 ? activeOauthState?.authError : apiKeyQueryAuthState.authError,
    isLoading: schemeQuery.isLoading || activeOauthState?.isAuthenticating === true,
    authenticateWithOauth,
  };
}
