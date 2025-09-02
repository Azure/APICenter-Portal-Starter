import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { isDefinitionIdValid } from '@/utils/apiDefinitions';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useApiSpecUrl(definitionId: ApiDefinitionId) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<string | undefined>({
    queryKey: [QueryKeys.ApiSpecUrl, definitionId],
    queryFn: async () => (await ApiService.getSpecificationLink(definitionId)) ?? null,
    staleTime: Infinity,
    enabled: isAuthenticated && isDefinitionIdValid(definitionId),
  });
}
