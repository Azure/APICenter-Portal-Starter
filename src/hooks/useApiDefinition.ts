import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiDefinition, ApiDefinitionId } from '@/types/apiDefinition';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import { isDefinitionIdValid } from '@/utils/apiDefinitions';
import useApiService from '@/hooks/useApiService';

interface ReturnType {
  value?: ApiDefinition;
  isLoading: boolean;
}

export default function useApiDefinition(definitionId: ApiDefinitionId): ReturnType {
  const [value, setValue] = useState<ApiDefinition | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const fetch = useCallback(async () => {
    if (!isDefinitionIdValid(definitionId) || !isAuthenticated) {
      setValue(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setValue(await ApiService.getDefinition(definitionId));
    } finally {
      setIsLoading(false);
    }
  }, [ApiService, definitionId, isAuthenticated]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    value,
    isLoading,
  };
}
