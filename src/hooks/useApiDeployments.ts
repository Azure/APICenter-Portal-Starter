import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiDeployment } from '@/types/apiDeployment';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useApiDeployments(apiId?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiDeployment[] | undefined>({
    queryKey: [QueryKeys.ApiDeployments, apiId],
    queryFn: async () => (await ApiService.getDeployments(apiId)) ?? null,
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && apiId),
  });
}
