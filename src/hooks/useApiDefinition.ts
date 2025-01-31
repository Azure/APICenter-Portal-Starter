import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiDefinition, ApiDefinitionId } from '@/types/apiDefinition';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import ApiService from '@/services/ApiService';
import { isDefinitionIdValid } from '@/utils/apiDefinitions';

interface ReturnType {
  value?: ApiDefinition;
  isLoading: boolean;
}

export default function useApiDefinition(definitionId: ApiDefinitionId): ReturnType {
  const [value, setValue] = useState<ApiDefinition | undefined>();
  const [isLoading, setIsLoading] = useState(true);

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
  }, [definitionId, isAuthenticated]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    value,
    isLoading,
  };
}
