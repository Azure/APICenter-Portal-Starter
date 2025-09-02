import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiEnvironment } from '@/types/apiEnvironment';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useDeploymentEnvironment(envId?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiEnvironment | undefined>({
    queryKey: [QueryKeys.ApiDeploymentEnvironment, envId],
    queryFn: async () => (await ApiService.getEnvironment(envId)) ?? null,
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && envId),
  });
}
