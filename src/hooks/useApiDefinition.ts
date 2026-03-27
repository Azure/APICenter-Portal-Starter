import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiDefinition, ApiDefinitionId } from '@/types/apiDefinition';
import { isDefinitionIdValid } from '@/utils/apiDefinitions';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useApiDefinition(definitionId: ApiDefinitionId) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiDefinition | undefined>({
    queryKey: [QueryKeys.ApiDefinition, definitionId],
    queryFn: async () => (await ApiService.getDefinition(definitionId)) ?? null,
    staleTime: Infinity,
    enabled: isAuthenticated && isDefinitionIdValid(definitionId),
  });
}
