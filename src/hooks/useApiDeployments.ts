import { useCallback, useEffect, useState } from 'react';
import { ApiDeployment } from '@/types/apiDeployment';
import { useSession } from '@/util/useSession';
import { useApiService } from '@/util/useApiService';

interface ReturnType {
  list: ApiDeployment[];
  isLoading: boolean;
}

export default function useApiDeployments(apiId?: string): ReturnType {
  const [list, setList] = useState<ApiDeployment[]>([]);
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

      const deployments = await apiService.getDeployments(apiId);
      setList(deployments.value);
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
