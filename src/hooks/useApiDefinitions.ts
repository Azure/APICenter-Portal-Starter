import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiDefinition } from '@/types/apiDefinition';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { ResourceType } from '@/types/apiDefinition';

export function useApiDefinitions(apiId?: string, version?: string, resourceType?: ResourceType) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiDefinition[] | undefined>({
    queryKey: [QueryKeys.ApiDefinitions, apiId, version, resourceType],
    queryFn: async () => (await ApiService.getDefinitions(apiId, version, resourceType)) ?? null,
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && apiId && version),
  });
}
