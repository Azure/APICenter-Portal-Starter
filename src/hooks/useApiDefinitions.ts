import { useCallback, useEffect, useState } from 'react';
import { ApiDefinition } from '@/contracts/apiDefinition';
import { useSession } from '@/util/useSession';
import { useApiService } from '@/util/useApiService';

interface ReturnType {
  list: ApiDefinition[];
  isLoading: boolean;
}

export default function useApiDefinitions(apiId?: string, version?: string): ReturnType {
  const [list, setList] = useState<ApiDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated } = useSession();
  const apiService = useApiService();

  const fetch = useCallback(async () => {
    if (!apiId || !version || !isAuthenticated) {
      setList([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const definitions = await apiService.getDefinitions(apiId, version);
      setList(definitions.value);
    } finally {
      setIsLoading(false);
    }
  }, [apiId, version, isAuthenticated, apiService]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    list,
    isLoading,
  };
}
