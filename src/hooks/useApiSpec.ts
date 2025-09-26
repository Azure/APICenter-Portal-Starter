import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { isDefinitionIdValid } from '@/utils/apiDefinitions';
import { ApiSpecReader } from '@/types/apiSpec';
import { getSpecReader } from '@/specReaders/getSpecReader';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useApiSpec(definitionId: ApiDefinitionId) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiSpecReader | undefined>({
    queryKey: [QueryKeys.ApiSpec, definitionId],
    queryFn: async () => {
      const definition = await ApiService.getDefinition(definitionId);
      const spec = await ApiService.getSpecification(definitionId);
      if (!spec) {
        throw new Error('Failed to fetch spec');
      }

      return await getSpecReader(spec, definition);
    },
    staleTime: Infinity,
    enabled: isAuthenticated && isDefinitionIdValid(definitionId),
  });
}
