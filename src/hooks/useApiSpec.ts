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
import { ApiAuthCredentials } from '@/types/apiAuth';

interface ReturnType extends ApiSpecReader {
  spec?: string;
  isLoading: boolean;
  requiresAuth: boolean;
}

export default function useApiSpec(
  definitionId: ApiDefinitionId, 
  deployment?: ApiDeployment, 
  authCredentials?: ApiAuthCredentials
): ReturnType {

  console.log('useApiSpec', authCredentials);
  const [spec, setSpec] = useState<string | undefined>();
  const [reader, setReader] = useState<ApiSpecReader | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [requiresAuth, setRequiresAuth] = useState(false);
  
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
        let mcpService = undefined;
        try {
          console.log('Creating McpService with auth:', !!authCredentials);
          mcpService = new McpService(deployment.server.runtimeUri[0], authCredentials);
          
          try {
            spec = await mcpService.collectMcpSpec();
            // If we successfully got the spec, we don't need auth
            setRequiresAuth(false);
          } catch (error) {
            console.error('MCP spec collection error:', error);
            
            // Check if service detected an auth error
            if (mcpService.hasAuthError?.()) {
              console.log('Auth error detected from McpService');
              setRequiresAuth(true);
              // Don't re-throw, we want to handle this gracefully
            } else {
              // Some other error occurred
              throw error;
            }
          }
        } catch (error) {
          console.error('McpService creation/initialization error:', error);
          
          // Check for auth errors in the initial connection
          if (
            error instanceof Error && 
            (error.message.includes('Authentication') || 
             error.message.includes('401') || 
             error.message.includes('403') ||
             error.message.includes('Unauthorized') ||
             error.message.includes('Forbidden'))
          ) {
            console.log('Auth error detected from error message');
            setRequiresAuth(true);
          } else {
            throw error;
          }
        } finally {
          if (mcpService) {
            mcpService.closeConnection();
          }
        }
      } else {
        spec = await ApiService.getSpecification(definitionId);
      }
      
      if (!spec) {
        if (isMcp && !requiresAuth) {
          // For MCP APIs, if we don't have a spec but it's not an auth issue,
          // let's assume we need auth anyway as a fallback
          console.log('No spec returned for MCP API - assuming auth required');
          setRequiresAuth(true);
        }
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
    } catch (error) {
      console.error('Error in useApiSpec:', error);
      
      // Only clear spec if not an auth issue
      if (!requiresAuth) {
        setSpec(undefined);
        setReader(undefined);
      }
    } finally {
      setIsLoading(false);
    }
  }, [ApiService, definitionId, deployment, isAuthenticated, authCredentials, requiresAuth]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return useMemo(
    () => ({
      ...reader,
      spec,
      isLoading,
      requiresAuth,
    }),
    [isLoading, reader, requiresAuth, spec]
  );
}
