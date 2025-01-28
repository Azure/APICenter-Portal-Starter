import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { OpenAPI } from 'openapi-types';
import { ApiDefinitionId } from '@/types/apiDefinition';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import { isDefinitionIdValid } from '@/utils/apiDefinitions';
import ApiService from '@/services/ApiService';

interface ReturnType {
  value?: OpenAPI.Document;
  isLoading: boolean;
}

export default function useApiSpec(definitionId: ApiDefinitionId): ReturnType {
  const [value, setValue] = useState<OpenAPI.Document | undefined>();
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
      setValue(await ApiService.getSpecification(definitionId));
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
