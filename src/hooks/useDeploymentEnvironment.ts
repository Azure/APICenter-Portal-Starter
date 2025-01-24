import { useCallback, useEffect, useState } from 'react';
import { ApiEnvironment } from '@/types/apiEnvironment';
import { useSession } from '@/util/useSession';
import { useApiService } from '@/util/useApiService';

interface ReturnType {
  data?: ApiEnvironment;
  isLoading: boolean;
}

export default function useDeploymentEnvironment(envId?: string): ReturnType {
  const [environment, setEnvironment] = useState<ApiEnvironment | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { isAuthenticated } = useSession();
  const apiService = useApiService();

  const fetch = useCallback(async () => {
    if (!envId || !isAuthenticated) {
      setEnvironment(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const environment = await apiService.getEnvironment(envId);
      setEnvironment(environment);
    } finally {
      setIsLoading(false);
    }
  }, [apiService, envId, isAuthenticated]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    data: environment,
    isLoading,
  };
}
