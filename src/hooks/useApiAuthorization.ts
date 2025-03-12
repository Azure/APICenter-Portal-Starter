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

interface ReturnType {
  schemeOptions?: ApiAuthSchemeMetadata[];
  scheme?: ApiAuthScheme;
  credentials?: ApiAuthCredentials;
  isLoading: boolean;
}

interface Props {
  apiName: string;
  versionName: string;
  oauthFlow?: string;
  schemeName?: string;
}

export default function useApiAuthorization({ apiName, versionName, oauthFlow, schemeName }: Props): ReturnType {
  const [schemeOptions, setSchemeOptions] = useState<ApiAuthSchemeMetadata[] | undefined>();
  const [scheme, setScheme] = useState<ApiAuthScheme | undefined>();
  const [credentials, setCredentials] = useState<ApiAuthCredentials | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const fetchSchemeOptions = useCallback(async () => {
    if (!apiName || !versionName || !isAuthenticated) {
      setSchemeOptions(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setScheme(undefined);
      setCredentials(undefined);
      setIsLoading(true);
      setSchemeOptions(await ApiService.getSecurityRequirements(apiName, versionName));
    } finally {
      setIsLoading(false);
    }
  }, [apiName, versionName, ApiService, isAuthenticated]);

  const fetchScheme = useCallback(async () => {
    if (!apiName || !versionName || !schemeName) {
      setScheme(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setScheme(undefined);
      setCredentials(undefined);
      setIsLoading(true);
      setScheme(await ApiService.getSecurityCredentials(apiName, versionName, schemeName));
    } finally {
      setIsLoading(false);
    }
  }, [apiName, versionName, schemeName, ApiService]);

  const authenticateWithOauth = useCallback(async () => {
    if (scheme?.securityScheme !== ApiAuthType.oauth2 || !oauthFlow || !OAuthGrantTypes[oauthFlow]) {
      return;
    }

    const token = await OAuthService.authenticate(scheme.oauth2, OAuthGrantTypes[oauthFlow]);
    setCredentials({ name: 'Authorization', value: token, in: 'header' });
  }, [oauthFlow, scheme]);

  useEffect(() => {
    void fetchSchemeOptions();
  }, [fetchSchemeOptions]);

  useEffect(() => {
    void fetchScheme();
  }, [fetchScheme]);

  useEffect(() => {
    void authenticateWithOauth();
  }, [authenticateWithOauth]);

  useEffect(() => {
    if (!scheme) {
      setCredentials(undefined);
      return;
    }

    if (scheme.securityScheme === ApiAuthType.apiKey) {
      setCredentials(scheme.apiKey);
      return;
    }
  }, [scheme]);

  return {
    schemeOptions,
    scheme,
    credentials,
    isLoading,
  };
}
