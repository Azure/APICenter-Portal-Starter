import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Spinner } from '@fluentui/react-components';
import ApiAccessAuthForm from '@/experiences/ApiAccessAuthForm';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import getMcpService from '@/services/McpService';
import { ApiSpecReader } from '@/types/apiSpec';
import getSpecReader from '@/specReaders/getSpecReader';
import useApiDefinition from '@/hooks/useApiDefinition';
import { ApiAuthCredentials, Oauth2Credentials } from '@/types/apiAuth';
import ApiSpecPageLayout from '../ApiSpecPageLayout';
import pageStyles from '../ApiSpec.module.scss';
import useApiService from '@/hooks/useApiService';
import { getMcpServerOAuthCredentials } from '@/utils/mcp';
import McpMetadataBasedAuthForm from './McpMetadataBasedAuthForm';
import styles from './McpSpecPage.module.scss';

enum McpServerAuthState {
  NOT_AUTHORIZED,
  DYNAMIC_REGISTRATION_FLOW,
  API_ACCESS_FLOW,
  AUTHORIZED,
}

interface Props {
  definitionId: ApiDefinitionId;
  deployment: ApiDeployment;
}

export const McpSpecPage: React.FC<Props> = ({ definitionId, deployment }) => {
  const [authState, setAuthState] = useState<McpServerAuthState>(McpServerAuthState.NOT_AUTHORIZED);
  const [mcpOAuthCredentials, setMcpOAuthCredentials] = useState<Oauth2Credentials | undefined>();
  const [authCredentials, setAuthCredentials] = useState<ApiAuthCredentials | undefined>();
  const [apiSpec, setApiSpec] = useState<ApiSpecReader>();
  const [isSpecLoading, setIsSpecLoading] = useState(false);

  const ApiService = useApiService();
  const definition = useApiDefinition(definitionId);

  const isAuthorized = authState === McpServerAuthState.AUTHORIZED;

  const determineAuthFlow = useCallback(async () => {
    if (!definitionId || authState !== McpServerAuthState.NOT_AUTHORIZED) {
      return;
    }

    // Use dynamic registration flow if the server has this feature
    const mcpServerCredentials = await getMcpServerOAuthCredentials(deployment.server.runtimeUri[0]);
    if (mcpServerCredentials) {
      setMcpOAuthCredentials(mcpServerCredentials);
      setAuthState(McpServerAuthState.DYNAMIC_REGISTRATION_FLOW);
      return;
    }

    // Use API access flow if it was configured for this server
    const securityRequirements = await ApiService.getSecurityRequirements(definitionId);
    if (securityRequirements.length) {
      setAuthState(McpServerAuthState.API_ACCESS_FLOW);
      return;
    }

    // Otherwise, we can assume that the server is authorized
    setAuthState(McpServerAuthState.AUTHORIZED);
  }, [ApiService, authState, definitionId, deployment]);

  useEffect(() => {
    void determineAuthFlow();
  }, [determineAuthFlow]);

  const mcpService = useMemo(() => {
    if (!isAuthorized || !deployment.server.runtimeUri) {
      return undefined;
    }

    return getMcpService(deployment.server.runtimeUri[0], authCredentials);
  }, [isAuthorized, deployment, authCredentials]);

  const makeApiSpec = useCallback(async () => {
    if (!isAuthorized || !mcpService || !definition.value) {
      return;
    }

    try {
      setIsSpecLoading(true);
      const spec = await mcpService.collectMcpSpec();
      const reader = await getSpecReader(spec, {
        ...definition.value,
        specification: {
          ...definition.value.specification,
          // TODO: this probably needs to be more robust
          name: 'mcp',
        },
      });
      setApiSpec(reader);
    } finally {
      setIsSpecLoading(false);
    }
  }, [definition.value, isAuthorized, mcpService]);

  useEffect(() => {
    void makeApiSpec();
  }, [makeApiSpec]);

  const handleAuthCredentialsChange = useCallback((credentials?: ApiAuthCredentials) => {
    setAuthCredentials(credentials);
    if (!!credentials) {
      setAuthState(McpServerAuthState.AUTHORIZED);
    }
  }, []);

  if (authState === McpServerAuthState.NOT_AUTHORIZED || definition.isLoading || isSpecLoading) {
    return <Spinner className={pageStyles.spinner} />;
  }

  if (authState === McpServerAuthState.API_ACCESS_FLOW) {
    return (
      <div className={styles.authPanel}>
        <ApiAccessAuthForm definitionId={definitionId} onChange={handleAuthCredentialsChange} />
      </div>
    );
  }

  if (authState === McpServerAuthState.DYNAMIC_REGISTRATION_FLOW) {
    return (
      <div className={styles.authPanel}>
        <McpMetadataBasedAuthForm credentials={mcpOAuthCredentials} onChange={handleAuthCredentialsChange} />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <ApiSpecPageLayout definitionId={definitionId} deployment={deployment} apiSpec={apiSpec} />;
};

export default React.memo(McpSpecPage);
