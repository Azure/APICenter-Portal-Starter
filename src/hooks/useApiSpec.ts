import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiDefinitionId } from '@/types/apiDefinition';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import { isDefinitionIdValid } from '@/utils/apiDefinitions';
import { ApiSpecReader } from '@/types/apiSpec';
import getSpecReader from '@/specReaders/getSpecReader';
import useApiService from '@/hooks/useApiService';
import { collectMcpSpec } from '@/utils/collectMcpSpec';

interface ReturnType extends ApiSpecReader {
  spec?: string;
  isLoading: boolean;
}

const MCP_SERVER_URL = 'http://localhost:3001';

export default function useApiSpec(definitionId: ApiDefinitionId): ReturnType {
  const [spec, setSpec] = useState<string | undefined>();
  const [reader, setReader] = useState<ApiSpecReader | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const ApiService = useApiService();

  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const fetchMcpSpec = useCallback(async () => {
    try {
      setIsLoading(true);
      const definition = await ApiService.getDefinition(definitionId);
      // TODO: use real MCP server URL (probably need to add selected deployment as an argument for this hook)
      const spec = await collectMcpSpec(MCP_SERVER_URL);
      setSpec(spec);
      setReader(
        await getSpecReader(spec, {
          // TODO: currently it is hardcoding mcp over whatever definition it is, remove override once we have real MCP definition
          ...definition,
          specification: {
            name: 'mcp',
          },
        })
      );
    } catch {
      setSpec(undefined);
      setReader(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [ApiService, definitionId]);

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
      setSpec(spec);
      setReader(await getSpecReader(spec, definition));
    } catch {
      setSpec(undefined);
      setReader(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [ApiService, definitionId, isAuthenticated]);

  // useEffect(() => {
  //   void fetch();
  // }, [fetch]);

  useEffect(() => {
    void fetchMcpSpec();
  }, [fetchMcpSpec]);

  return useMemo(
    () => ({
      ...reader,
      spec,
      isLoading,
    }),
    [isLoading, reader, spec]
  );
}
