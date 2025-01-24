import { useCallback, useEffect, useState } from 'react';
import { Api } from '@/contracts/api';
import { useSession } from '@/util/useSession';
import { useApiService } from '@/util/useApiService';

interface ReturnType {
  data?: Api;
  isLoading: boolean;
}

export default function useApi(id?: string): ReturnType {
  const [api, setApi] = useState<Api | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated } = useSession();
  const apiService = useApiService();

  const fetch = useCallback(async () => {
    if (!id || !isAuthenticated) {
      setApi(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const api = await apiService.getApi(id);
      setApi(api);
    } finally {
      setIsLoading(false);
    }
  }, [apiService, id, isAuthenticated]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    data: api,
    isLoading,
  };
}
