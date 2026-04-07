import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { SkillEvaluationResult } from '@/types/skillEvaluation';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useSkillEvaluationResult(skillName?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<SkillEvaluationResult | undefined>({
    queryKey: [QueryKeys.SkillEvaluationResult, skillName],
    queryFn: () => ApiService.getSkillEvaluationResult(skillName!),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && skillName),
  });
}
