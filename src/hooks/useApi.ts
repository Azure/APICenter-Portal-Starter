import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiMetadata } from '@/types/api';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useApi(apiId?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiMetadata | undefined>({
    queryKey: [QueryKeys.Api, apiId],
    queryFn: async () => (await ApiService.getApi(apiId)) ?? null,
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && apiId),
  });
}
