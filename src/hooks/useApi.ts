import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiMetadata } from '@/types/api';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { ResourceType } from '@/types/apiDefinition';

export function useApi(apiId?: string, resourceType?: ResourceType) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiMetadata | undefined>({
    queryKey: [QueryKeys.Api, apiId, resourceType],
    queryFn: async () => (await ApiService.getApi(apiId, resourceType)) ?? null,
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && apiId),
  });
}
