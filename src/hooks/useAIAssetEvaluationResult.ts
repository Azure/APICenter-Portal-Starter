import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { AIAssetResourceType } from '@/types/aiAsset';
import { SkillEvaluationResult, AgentEvaluationResult } from '@/types/evaluation';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { getMockEvalResult } from '@/mocks/skillEvaluationMocks';
import { getMockAgentEvalResult } from '@/mocks/agentEvaluationMocks';

export function useAIAssetEvaluationResult(
  name: string | undefined,
  versionName: string | undefined,
  resourceType: AIAssetResourceType
) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<SkillEvaluationResult | AgentEvaluationResult | undefined>({
    queryKey: [QueryKeys.AIAssetEvaluationResult, resourceType, name, versionName],
    queryFn: async () => {
      const result = await ApiService.getAIAssetEvaluationResult(name!, versionName!, resourceType);
      // DEV FALLBACK: use mock data when backend returns nothing.
      // Remove this fallback when real evaluation data is available.
      if (!result && import.meta.env.DEV) {
        return resourceType === 'skills'
          ? getMockEvalResult(name!)
          : getMockAgentEvalResult(name!);
      }
      return result;
    },
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && name && versionName),
  });
}
