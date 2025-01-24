import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiDeployment } from '@/types/apiDeployment';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import ApiService from '@/services/ApiService';

interface ReturnType {
  list: ApiDeployment[];
  isLoading: boolean;
}

export default function useApiDeployments(apiId?: string): ReturnType {
  const [list, setList] = useState<ApiDeployment[]>([]);
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
      setList(await ApiService.getDeployments(apiId));
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
