import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { SkillEvaluationResult } from '@/types/skillEvaluation';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { getMockEvalResult } from '@/mocks/skillEvaluationMocks';

export function useSkillEvaluationResult(skillName?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<SkillEvaluationResult | undefined>({
    queryKey: [QueryKeys.SkillEvaluationResult, skillName],
    queryFn: async () => {
      const result = await ApiService.getSkillEvaluationResult(skillName!);
      // DEV FALLBACK: use mock data when backend returns nothing.
      // Remove this fallback when real evaluation data is available.
      if (!result && import.meta.env.DEV) {
        return getMockEvalResult(skillName!);
      }
      return result;
    },
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && skillName),
  });
}
