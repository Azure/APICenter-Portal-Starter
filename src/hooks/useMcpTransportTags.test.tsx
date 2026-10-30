import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appServicesAtom } from '@/atoms/appServicesAtom';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useMcpTransportTags } from './useMcpTransportTags';
import { useServer } from './useServer';

const mocks = vi.hoisted(() => ({
  getDeployments: vi.fn(),
  getServer: vi.fn(),
}));

vi.mock('@/hooks/useApiService', () => ({
  useApiService: () => ({
    getDeployments: mocks.getDeployments,
    getServer: mocks.getServer,
  }),
}));

function createWrapper(): React.FC<React.PropsWithChildren> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

describe('useMcpTransportTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shares the Server query shape with useServer', async () => {
    const server = {
      name: 'example',
      packages: [{ identifier: 'example', registryType: 'npm' }],
    };
    mocks.getServer.mockResolvedValue(server);
    mocks.getDeployments.mockResolvedValue([]);

    const { result } = renderHook(
      () => ({
        tags: useMcpTransportTags(['example']),
        server: useServer('example'),
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.server.data).toEqual(server);
      expect(result.current.tags).toEqual({ example: ['Local'] });
    });
    expect(mocks.getServer).toHaveBeenCalledOnce();
  });
});
