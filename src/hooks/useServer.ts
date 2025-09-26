import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { Server } from '@/types/server';

export function useServer(name?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<Server | undefined>({
    queryKey: [QueryKeys.Server, name],
    queryFn: async () => (await ApiService.getServer(name)) || null,
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && name),
  });
}
