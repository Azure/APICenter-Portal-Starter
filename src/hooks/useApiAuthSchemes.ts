import { useQuery } from '@tanstack/react-query';
import { useRecoilValue } from 'recoil';
import { ApiAuthSchemeMetadata } from '@/types/apiAuth';
import { QueryKeys } from '@/constants/QueryKeys';
import { useApiService } from '@/hooks/useApiService';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { ApiDefinitionId } from '@/types/apiDefinition';

export function useApiAuthSchemes(definitionId: ApiDefinitionId) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<ApiAuthSchemeMetadata[] | undefined>({
    queryKey: [QueryKeys.ApiAuthSchemeOptions, definitionId],
    queryFn: () => ApiService.getSecurityRequirements(definitionId),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && definitionId),
  });
}
