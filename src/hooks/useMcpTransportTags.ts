import { useQueries } from '@tanstack/react-query';
import { useRecoilValue } from 'recoil';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export type McpTransport = 'Local' | 'Remote';

/**
 * For a list of MCP server names, fetches server + deployment data in parallel
 * and returns a map of name → transport tags.
 */
export function useMcpTransportTags(mcpNames: string[]): Record<string, string[]> {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const serverQueries = useQueries({
    queries: mcpNames.map((name) => ({
      queryKey: [QueryKeys.Server, name],
      queryFn: async () => (await ApiService.getServer(name)) || null,
      staleTime: Infinity,
      enabled: isAuthenticated,
    })),
  });

  const deploymentQueries = useQueries({
    queries: mcpNames.map((name) => ({
      queryKey: [QueryKeys.ApiDeployments, name],
      queryFn: async () => {
        const deployments = await ApiService.getDeployments(name);
        return { name, deployments };
      },
      staleTime: Infinity,
      enabled: isAuthenticated,
    })),
  });

  const result: Record<string, string[]> = {};

  for (let i = 0; i < mcpNames.length; i++) {
    const name = mcpNames[i];
    const serverData = serverQueries[i]?.data;
    const deploymentData = deploymentQueries[i]?.data;

    const hasLocal = !!serverData?.packages?.length;
    const hasRemote = !!serverData?.remotes?.length ||
      deploymentData?.deployments?.some(
        (d) => d.server.runtimeUri.length > 0
      );

    if (hasRemote && hasLocal) {
      result[name] = ['Remote + Local'];
    } else if (hasRemote) {
      result[name] = ['Remote'];
    } else if (hasLocal) {
      result[name] = ['Local'];
    } else {
      result[name] = [];
    }
  }

  return result;
}
