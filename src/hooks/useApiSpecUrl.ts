import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import ApiService from '@/services/ApiService';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { isDefinitionIdValid } from '@/utils/apiDefinitions';

interface ReturnType {
  value?: string;
  isLoading: boolean;
}

export default function useApiSpecUrl(definitionId: ApiDefinitionId): ReturnType {
  const [value, setValue] = useState<string | undefined>();
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
      setValue(await ApiService.getSpecificationLink(definitionId));
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
