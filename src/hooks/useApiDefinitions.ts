import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiDefinition } from '@/types/apiDefinition';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useApiDefinitions(apiId?: string, version?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiDefinition[] | undefined>({
    queryKey: [QueryKeys.ApiDefinitions, apiId, version],
    queryFn: () => ApiService.getDefinitions(apiId, version),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && apiId && version),
  });
}
