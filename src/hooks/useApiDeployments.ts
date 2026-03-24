import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiDeployment } from '@/types/apiDeployment';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { ResourceType } from '@/types/apiDefinition';

export function useApiDeployments(apiId?: string, resourceType?: ResourceType) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiDeployment[] | undefined>({
    queryKey: [QueryKeys.ApiDeployments, apiId, resourceType],
    queryFn: async () => (await ApiService.getDeployments(apiId, resourceType)) ?? null,
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && apiId),
  });
}
