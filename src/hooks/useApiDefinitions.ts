import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiDefinition } from '@/types/apiDefinition';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import useApiService from '@/hooks/useApiService';

interface ReturnType {
  list: ApiDefinition[];
  isLoading: boolean;
}

export default function useApiDefinitions(apiId?: string, version?: string): ReturnType {
  const [list, setList] = useState<ApiDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const fetch = useCallback(async () => {
    if (!apiId || !version || !isAuthenticated) {
      setList([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setList(await ApiService.getDefinitions(apiId, version));
    } finally {
      setIsLoading(false);
    }
  }, [apiId, version, isAuthenticated, ApiService]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    list,
    isLoading,
  };
}
