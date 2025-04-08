import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import {
  ApiAuthCredentials,
  ApiAuthScheme,
  ApiAuthSchemeMetadata,
  ApiAuthType,
  OAuthGrantTypes,
} from '@/types/apiAuth';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import useApiService from '@/hooks/useApiService';
import OAuthService from '@/services/OAuthService';
import { ApiDefinitionId } from '@/types/apiDefinition';

interface ReturnType {
  schemeOptions?: ApiAuthSchemeMetadata[];
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

export default function useApiAuthorization({ definitionId, schemeName }: Props): ReturnType {
  const [schemeOptions, setSchemeOptions] = useState<ApiAuthSchemeMetadata[] | undefined>();
  const [scheme, setScheme] = useState<ApiAuthScheme | undefined>();
  const [credentials, setCredentials] = useState<ApiAuthCredentials | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string>(undefined);

  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const fetchSchemeOptions = useCallback(async () => {
    if (!definitionId.apiName || !definitionId.versionName || !isAuthenticated) {
      setSchemeOptions(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setScheme(undefined);
      setCredentials(undefined);
      setIsLoading(true);
      setSchemeOptions(await ApiService.getSecurityRequirements(definitionId));
    } finally {
      setIsLoading(false);
    }
  }, [definitionId, ApiService, isAuthenticated]);

  const fetchScheme = useCallback(async () => {
    if (!definitionId.apiName || !definitionId.versionName || !schemeName) {
      setScheme(undefined);
      return;
    }

    try {
      setScheme(undefined);
      setCredentials(undefined);
      setIsLoading(true);
      setScheme(await ApiService.getSecurityCredentials(definitionId, schemeName));
    } finally {
      setIsLoading(false);
    }
  }, [definitionId, schemeName, ApiService]);

  const authenticateWithOauth = useCallback(
    async (oauthFlow: string) => {
      if (isLoading) {
        return;
      }

      if (scheme?.securityScheme !== ApiAuthType.oauth2) {
        throw new Error('Currently selected scheme is not OAuth2');
      }

      if (!OAuthGrantTypes[oauthFlow]) {
        throw new Error(`Unsupported grant type: ${oauthFlow}`);
      }

      try {
        setCredentials(undefined);
        setIsLoading(true);
        const token = await OAuthService.authenticate(scheme.oauth2, OAuthGrantTypes[oauthFlow]);
        if (token !== undefined) {
          setCredentials({ name: 'Authorization', value: token, in: 'header', createdAt: new Date() });
        }
      } catch (e) {
        setAuthError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, scheme]
  );

  useEffect(() => {
    void fetchSchemeOptions();
  }, [fetchSchemeOptions]);

  useEffect(() => {
    void fetchScheme();
  }, [fetchScheme]);

  useEffect(() => {
    if (!scheme) {
      setCredentials(undefined);
      return;
    }

    if (scheme.securityScheme === ApiAuthType.apiKey) {
      setCredentials({ ...scheme.apiKey, createdAt: new Date() });
      return;
    }
  }, [scheme]);

  return {
    schemeOptions,
    scheme,
    credentials,
    authError,
    isLoading,
    authenticateWithOauth,
  };
}
