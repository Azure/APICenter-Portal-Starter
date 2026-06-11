import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { AIAssetResourceType, AIAssetArtifact } from '@/types/aiAsset';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useAIAssetArtifacts(
  name: string | undefined,
  versionName: string | undefined,
  resourceType: AIAssetResourceType
) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<AIAssetArtifact[]>({
    queryKey: [QueryKeys.AIAssetArtifacts, resourceType, name, versionName],
    queryFn: () => ApiService.getAIAssetArtifacts(name!, versionName!, resourceType),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && name && versionName),
  });
}
