/* eslint-disable prettier/prettier */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiDefinitionId } from '@/types/apiDefinition';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import { isDefinitionIdValid } from '@/utils/apiDefinitions';
import { ApiSpecReader } from '@/types/apiSpec';
import getSpecReader from '@/specReaders/getSpecReader';
import useApiService from '@/hooks/useApiService';

interface ReturnType extends ApiSpecReader {
  spec?: string;
  isLoading: boolean;
}

export default function useApiSpec(definitionId: ApiDefinitionId): ReturnType {
  const [spec, setSpec] = useState<string | undefined>();
  const [reader, setReader] = useState<ApiSpecReader | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  
  const ApiService = useApiService();

  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);
  
  const fetch = useCallback(async () => {
    if (!isDefinitionIdValid(definitionId) || !isAuthenticated) {
      setSpec(undefined);
      setReader(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const definition = await ApiService.getDefinition(definitionId);
      const spec = await ApiService.getSpecification(definitionId);
      
      if (!spec) {
        throw new Error('Failed to fetch spec');
      }

      setSpec(spec);
      setReader(await getSpecReader(spec, definition));
    } catch {
      setSpec(undefined);
      setReader(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [ApiService, definitionId, isAuthenticated]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return useMemo(
    () => ({
      ...reader,
      spec,
      isLoading,
    }),
    [isLoading, reader, spec]
  );
}
