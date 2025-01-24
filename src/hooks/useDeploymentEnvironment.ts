import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiEnvironment } from '@/types/apiEnvironment';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import ApiService from '@/services/ApiService';

interface ReturnType {
  data?: ApiEnvironment;
  isLoading: boolean;
}

export default function useDeploymentEnvironment(envId?: string): ReturnType {
  const [environment, setEnvironment] = useState<ApiEnvironment | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const fetch = useCallback(async () => {
    if (!envId || !isAuthenticated) {
      setEnvironment(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setEnvironment(await ApiService.getEnvironment(envId));
    } finally {
      setIsLoading(false);
    }
  }, [envId, isAuthenticated]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    data: environment,
    isLoading,
  };
}
