/* eslint-disable prettier/prettier */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiDefinitionId } from '@/types/apiDefinition';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import { isDefinitionIdValid } from '@/utils/apiDefinitions';
import { ApiSpecReader } from '@/types/apiSpec';
import getSpecReader from '@/specReaders/getSpecReader';
import useApiService from '@/hooks/useApiService';
import { ApiDeployment } from '@/types/apiDeployment';
import McpService from '@/services/McpService';

interface ReturnType extends ApiSpecReader {
  spec?: string;
  isLoading: boolean;
}

export default function useApiSpec(definitionId: ApiDefinitionId, deployment: ApiDeployment): ReturnType {
  const [spec, setSpec] = useState<string | undefined>();
  const [reader, setReader] = useState<ApiSpecReader | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  
  const ApiService = useApiService();

  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);
  
  const fetch = useCallback(async () => {
    if (!isDefinitionIdValid(definitionId) || !isAuthenticated || !deployment) {
      setSpec(undefined);
      setReader(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const api = await ApiService.getApi(definitionId.apiName);
      const definition = await ApiService.getDefinition(definitionId);

      let spec: string | undefined;

      const isMcp = api.kind === 'mcp';
      if (isMcp) {
        const mcpService = new McpService(deployment.server.runtimeUri[0]);
        spec = await mcpService.collectMcpSpec();
        mcpService.closeConnection();
      } else {
        spec = await ApiService.getSpecification(definitionId);
      }
      
      if (!spec) {
        throw new Error('Failed to fetch spec');
      }

      setSpec(spec);
      setReader(await getSpecReader(spec, {
        ...definition,
        specification: {
          ...definition.specification,
          // TODO: this probably needs to be more robust
          name: isMcp ? 'mcp' : definition.specification?.name,
        },
      }));
    } catch {
      setSpec(undefined);
      setReader(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [ApiService, definitionId, deployment, isAuthenticated]);

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
