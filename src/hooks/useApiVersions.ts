import { useCallback, useEffect, useState } from 'react';
import { ApiVersion } from '@/contracts/apiVersion';
import { useSession } from '@/util/useSession';
import { useApiService } from '@/util/useApiService';

interface ReturnType {
  list: ApiVersion[];
  isLoading: boolean;
}

export default function useApiVersions(apiId?: string): ReturnType {
  const [list, setList] = useState<ApiVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated } = useSession();
  const apiService = useApiService();

  const fetch = useCallback(async () => {
    if (!apiId || !isAuthenticated) {
      setList([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const versions = await apiService.getVersions(apiId);
      setList(versions.value);
    } finally {
      setIsLoading(false);
    }
  }, [apiService, apiId, isAuthenticated]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    list,
    isLoading,
  };
}
