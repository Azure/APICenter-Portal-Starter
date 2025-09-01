import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiDefinition, ApiDefinitionId } from '@/types/apiDefinition';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useApiDefinition(definitionId: ApiDefinitionId) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiDefinition | undefined>({
    queryKey: [QueryKeys.ApiDefinition, definitionId],
    queryFn: () => ApiService.getDefinition(definitionId),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && definitionId),
  });
}
