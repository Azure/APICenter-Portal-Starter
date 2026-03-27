import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { LanguageModelMetadata } from '@/types/languageModel';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { QueryKeys } from '@/constants/QueryKeys';
import { LanguageModelService } from '@/services/LanguageModelService';

export function useLanguageModel(name?: string) {
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<LanguageModelMetadata | undefined>({
    queryKey: [QueryKeys.LanguageModel, name],
    queryFn: async () => (await LanguageModelService.getLanguageModel(name!)) ?? null,
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && name),
  });
}
