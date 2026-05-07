import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useAgentDefinition(agentName?: string, versionName?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<string | undefined>({
    queryKey: [QueryKeys.AgentDefinition, agentName, versionName],
    queryFn: () => ApiService.getAgentDefinition(agentName!, versionName!),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && agentName && versionName),
  });
}
