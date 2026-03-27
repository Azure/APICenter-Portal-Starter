import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiVersion } from '@/types/apiVersion';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { ResourceType } from '@/types/apiDefinition';

export function useApiVersions(apiId?: string, resourceType?: ResourceType) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiVersion[] | undefined>({
    queryKey: [QueryKeys.ApiVersions, apiId, resourceType],
    queryFn: async () => (await ApiService.getVersions(apiId, resourceType)) ?? null,
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && apiId),
  });
}
