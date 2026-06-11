import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { AIAssetResourceType, AIAssetVersion } from '@/types/aiAsset';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useAIAssetVersions(name: string | undefined, resourceType: AIAssetResourceType) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<AIAssetVersion[]>({
    queryKey: [QueryKeys.AIAssetVersions, resourceType, name],
    queryFn: () => ApiService.getAIAssetVersions(name!, resourceType),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && name),
  });
}
