import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { AgentEvaluationResult } from '@/types/evaluation';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { getMockAgentEvalResult } from '@/mocks/agentEvaluationMocks';

export function useAgentEvaluationResult(agentName?: string, versionName?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<AgentEvaluationResult | undefined>({
    queryKey: [QueryKeys.AgentEvaluationResult, agentName, versionName],
    queryFn: async () => {
      const result = await ApiService.getAgentEvaluationResult(agentName!, versionName!);
      // DEV FALLBACK: use mock data when backend returns nothing.
      // Remove this fallback when real evaluation data is available.
      if (!result && import.meta.env.DEV) {
        return getMockAgentEvalResult(agentName!);
      }
      return result;
    },
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && agentName && versionName),
  });
}
