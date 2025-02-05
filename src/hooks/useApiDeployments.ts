import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiDeployment } from '@/types/apiDeployment';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import useApiService from '@/hooks/useApiService';

interface ReturnType {
  list: ApiDeployment[];
  isLoading: boolean;
}

export default function useApiDeployments(apiId?: string): ReturnType {
  const [list, setList] = useState<ApiDeployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const fetch = useCallback(async () => {
    if (!apiId || !isAuthenticated) {
      setList([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setList(await ApiService.getDeployments(apiId));
    } finally {
      setIsLoading(false);
    }
  }, [ApiService, apiId, isAuthenticated]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    list,
    isLoading,
  };
}
