import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiMetadata } from '@/types/api';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import ApiService from '@/services/ApiService';

interface ReturnType {
  data?: ApiMetadata;
  isLoading: boolean;
}

export default function useApi(id?: string): ReturnType {
  const [api, setApi] = useState<ApiMetadata | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const fetch = useCallback(async () => {
    if (!id || !isAuthenticated) {
      setApi(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setApi(await ApiService.getApi(id));
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    data: api,
    isLoading,
  };
}
