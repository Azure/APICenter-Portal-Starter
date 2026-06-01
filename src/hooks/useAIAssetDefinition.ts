import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { AIAssetResourceType } from '@/types/aiAsset';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useAIAssetDefinition(
  name: string | undefined,
  versionName: string | undefined,
  resourceType: AIAssetResourceType
) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<string | undefined>({
    queryKey: [QueryKeys.AIAssetDefinition, resourceType, name, versionName],
    queryFn: () => ApiService.getAIAssetDefinition(name!, versionName!, resourceType),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && name && versionName),
  });
}
