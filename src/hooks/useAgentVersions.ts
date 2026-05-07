import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { AgentVersion } from '@/types/agent';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useAgentVersions(agentName?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<AgentVersion[]>({
    queryKey: [QueryKeys.AgentVersions, agentName],
    queryFn: () => ApiService.getAgentVersions(agentName!),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && agentName),
  });
}
