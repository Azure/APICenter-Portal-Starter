import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { PluginDetails } from '@/types/plugin';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function usePlugin(name?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<PluginDetails | undefined>({
    queryKey: [QueryKeys.Plugin, name],
    queryFn: async () => (await ApiService.getPlugin(name!)) ?? null,
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && name),
  });
}
