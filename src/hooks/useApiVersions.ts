import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiVersion } from '@/types/apiVersion';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import ApiService from '@/services/ApiService';

interface ReturnType {
  list: ApiVersion[];
  isLoading: boolean;
}

export default function useApiVersions(apiId?: string): ReturnType {
  const [list, setList] = useState<ApiVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const fetch = useCallback(async () => {
    if (!apiId || !isAuthenticated) {
      setList([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setList(await ApiService.getVersions(apiId));
    } finally {
      setIsLoading(false);
    }
  }, [apiId, isAuthenticated]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    list,
    isLoading,
  };
}
