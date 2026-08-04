import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appServicesAtom } from '@/atoms/appServicesAtom';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { OAuthService } from '@/services/OAuthService';
import { ApiAuthScheme, ApiAuthType, OAuthGrantTypes } from '@/types/apiAuth';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { MISSING_CREDENTIALS_ERROR } from '@/utils/apiAuth';
import { useApiAuthorization } from './useApiAuthorization';

const mocks = vi.hoisted(() => ({
  getSecurityCredentials: vi.fn(),
}));

vi.mock('@/hooks/useApiService', () => ({
  useApiService: () => ({
    getSecurityCredentials: mocks.getSecurityCredentials,
  }),
}));

const definitionA: ApiDefinitionId = {
  apiName: 'api-a',
  versionName: 'v1',
  definitionName: 'definition-a',
};

const definitionB: ApiDefinitionId = {
  apiName: 'api-b',
  versionName: 'v1',
  definitionName: 'definition-b',
};

const oauthScheme: ApiAuthScheme = {
  securityScheme: ApiAuthType.oauth2,
  oauth2: {
    clientId: 'portal-client',
    authorizationUrl: 'https://login.example.test/authorize',
    supportedScopes: [],
    supportedFlows: [OAuthGrantTypes.implicit],
  },
};

const apiKeyScheme: ApiAuthScheme = {
  securityScheme: ApiAuthType.apiKey,
  apiKey: {
    name: 'X-API-Key',
    value: 'api-key-value',
    in: 'header',
    createdAt: new Date(),
  },
};

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function createWrapper(): React.FC<React.PropsWithChildren> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: React.PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <RecoilRoot
          initializeState={({ set }) => {
            set(isAuthenticatedAtom, true);
            set(appServicesAtom, {
              AuthService: {
                isAuthenticated: () => Promise.resolve(true),
                getAccessToken: () => Promise.resolve(''),
                signIn: () => Promise.resolve(),
                signOut: () => Promise.resolve(),
              },
            });
          }}
        >
          {children}
        </RecoilRoot>
      </QueryClientProvider>
    );
  };
}

describe('useApiAuthorization', () => {
  beforeEach(() => {
    mocks.getSecurityCredentials.mockReset();
    vi.restoreAllMocks();
  });

  it('ignores an OAuth completion after the active definition changes', async () => {
    const token = createDeferred<string | undefined>();
    mocks.getSecurityCredentials.mockResolvedValue(oauthScheme);
    const authenticate = vi.spyOn(OAuthService, 'authenticate').mockReturnValue(token.promise);

    const { result, rerender } = renderHook(
      ({ definitionId }) => useApiAuthorization({ definitionId, schemeName: 'oauth' }),
      {
        initialProps: { definitionId: definitionA },
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.scheme).toEqual(oauthScheme));

    await act(async () => {
      void result.current.authenticateWithOauth(OAuthGrantTypes.implicit);
    });

    await waitFor(() => expect(authenticate).toHaveBeenCalledTimes(1));

    rerender({ definitionId: definitionB });

    await waitFor(() => expect(result.current.scheme).toEqual(oauthScheme));

    await act(async () => {
      token.resolve('Bearer token-for-definition-a');
      await token.promise;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.credentials).toBeUndefined();
    expect(result.current.authError).toBeUndefined();
  });

  it('ignores an OAuth error after the active definition changes', async () => {
    const token = createDeferred<string | undefined>();
    const authenticate = vi.spyOn(OAuthService, 'authenticate').mockReturnValue(token.promise);
    mocks.getSecurityCredentials.mockResolvedValue(oauthScheme);

    const { result, rerender } = renderHook(
      ({ definitionId }) => useApiAuthorization({ definitionId, schemeName: 'oauth' }),
      {
        initialProps: { definitionId: definitionA },
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.scheme).toEqual(oauthScheme));

    await act(async () => {
      void result.current.authenticateWithOauth(OAuthGrantTypes.implicit);
    });

    await waitFor(() => expect(authenticate).toHaveBeenCalledTimes(1));

    rerender({ definitionId: definitionB });

    await waitFor(() => expect(result.current.scheme).toEqual(oauthScheme));

    await act(async () => {
      token.reject(new Error('Authentication failed for definition A'));
      try {
        await token.promise;
      } catch {
        // The hook consumes the OAuth failure internally.
      }
    });

    expect(result.current.credentials).toBeUndefined();
    expect(result.current.authError).toBeUndefined();
  });

  it('ignores an OAuth completion after the selected scheme changes', async () => {
    const token = createDeferred<string | undefined>();
    const authenticate = vi.spyOn(OAuthService, 'authenticate').mockReturnValue(token.promise);
    mocks.getSecurityCredentials.mockResolvedValue(oauthScheme);

    const { result, rerender } = renderHook(
      ({ schemeName }) => useApiAuthorization({ definitionId: definitionA, schemeName }),
      {
        initialProps: { schemeName: 'oauth-a' },
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.scheme).toEqual(oauthScheme));

    await act(async () => {
      void result.current.authenticateWithOauth(OAuthGrantTypes.implicit);
    });

    await waitFor(() => expect(authenticate).toHaveBeenCalledTimes(1));

    rerender({ schemeName: 'oauth-b' });

    await waitFor(() => expect(result.current.scheme).toEqual(oauthScheme));

    await act(async () => {
      token.resolve('Bearer token-for-oauth-a');
      await token.promise;
    });

    expect(result.current.credentials).toBeUndefined();
    expect(result.current.authError).toBeUndefined();
  });

  it('clears cached API-key credentials when no auth option is selected', async () => {
    mocks.getSecurityCredentials.mockResolvedValue(apiKeyScheme);

    const { result, rerender } = renderHook(
      ({ schemeName }) => useApiAuthorization({ definitionId: definitionA, schemeName }),
      {
        initialProps: { schemeName: 'api-key' },
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.credentials).toMatchObject({
        name: apiKeyScheme.apiKey.name,
        value: apiKeyScheme.apiKey.value,
        in: apiKeyScheme.apiKey.in,
      })
    );

    rerender({ schemeName: undefined });

    await waitFor(() => {
      expect(result.current.credentials).toBeUndefined();
      expect(result.current.authError).toBeUndefined();
    });
  });

  it('clears the unavailable-credentials error when no auth option is selected', async () => {
    mocks.getSecurityCredentials.mockResolvedValue({
      securityScheme: ApiAuthType.apiKey,
    });

    const { result, rerender } = renderHook(
      ({ schemeName }) => useApiAuthorization({ definitionId: definitionA, schemeName }),
      {
        initialProps: { schemeName: 'unavailable-api-key' },
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.credentials).toBeUndefined();
      expect(result.current.authError).toBe(MISSING_CREDENTIALS_ERROR);
    });

    rerender({ schemeName: undefined });

    await waitFor(() => {
      expect(result.current.credentials).toBeUndefined();
      expect(result.current.authError).toBeUndefined();
    });
  });
});
