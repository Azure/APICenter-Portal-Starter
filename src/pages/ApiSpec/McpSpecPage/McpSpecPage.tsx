import React, { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@fluentui/react-components';
import { getRecoil } from 'recoil-nexus';
import ApiAccessAuthForm from '@/experiences/ApiAccessAuthForm';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import {
  getMcpService,
  getUnsupportedMcpTransportMessage,
  McpService,
  McpUnauthorizedError,
} from '@/services/McpService';
import { ApiSpecReader } from '@/types/apiSpec';
import { getSpecReader } from '@/specReaders/getSpecReader';
import { useApiDefinition } from '@/hooks/useApiDefinition';
import { ApiAuthCredentials, Oauth2Credentials } from '@/types/apiAuth';
import ApiSpecPageLayout from '../ApiSpecPageLayout';
import pageStyles from '../ApiSpec.module.scss';
import { useApiService } from '@/hooks/useApiService';
import { McpAuthService } from '@/services/McpAuthService';
import { McpDiscoveredAuth } from '@/types/mcp';
import { McpMsalAuthService } from '@/services/McpMsalAuthService';
import { configAtom } from '@/atoms/configAtom';
import { McpAuthProvider } from '@/contexts/McpAuthContext';
import { getApiDefinitionKey } from '@/utils/apiAuth';
import styles from './McpSpecPage.module.scss';
import McpMetadataBasedAuthForm from './McpMetadataBasedAuthForm';

enum McpServerAuthState {
  NOT_AUTHORIZED,
  DYNAMIC_REGISTRATION_FLOW,
  API_ACCESS_FLOW,
  MSAL_CONSENT_NEEDED,
  AUTHORIZED,
}

export interface McpSpecPageProps {
  definitionId: ApiDefinitionId;
  deployment: ApiDeployment;
}

type IsActive = () => boolean;

interface McpServiceConnection {
  deployment: ApiDeployment;
  definitionKey: string;
  authCredentials?: ApiAuthCredentials;
  runtimeUri: string;
  transport?: string | null;
  service: McpService;
}

export const McpSpecPage: React.FC<McpSpecPageProps> = ({ definitionId, deployment }) => {
  const [authState, setAuthState] = useState<McpServerAuthState>(McpServerAuthState.NOT_AUTHORIZED);
  const [mcpOAuthCredentials, setMcpOAuthCredentials] = useState<Oauth2Credentials | undefined>();
  const [authCredentials, setAuthCredentials] = useState<ApiAuthCredentials | undefined>();
  const [apiSpec, setApiSpec] = useState<ApiSpecReader>();
  const [isSpecLoading, setIsSpecLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [msalDiscoveredAuth, setMsalDiscoveredAuth] = useState<McpDiscoveredAuth | undefined>();
  const [connection, setConnection] = useState<McpServiceConnection>();

  const ApiService = useApiService();
  const definition = useApiDefinition(definitionId);

  const isAuthorized = authState === McpServerAuthState.AUTHORIZED;
  const definitionKey = getApiDefinitionKey(definitionId);
  const runtimeUri = deployment?.server?.runtimeUri?.[0];
  const transport = deployment?.server?.mcpTransportProtocol;
  const transportError = getUnsupportedMcpTransportMessage(transport);
  const mcpService =
    isAuthorized &&
    connection &&
    connection.deployment === deployment &&
    connection.definitionKey === definitionKey &&
    connection.authCredentials === authCredentials &&
    connection.runtimeUri === runtimeUri &&
    connection.transport === transport
      ? connection.service
      : undefined;

  const determineAuthFlow = useCallback(
    async (isActive: IsActive) => {
      if (!definitionId || !deployment || transportError || authState !== McpServerAuthState.NOT_AUTHORIZED) {
        return;
      }

      // Prefer pre-configured "API access" auth if it exists — it already contains the
      // correct token/authorization endpoints, so no .well-known discovery is needed.
      const securityRequirements = await ApiService.getSecurityRequirements(definitionId);
      if (!isActive()) {
        return;
      }
      if (securityRequirements.length) {
        setAuthState(McpServerAuthState.API_ACCESS_FLOW);
        return;
      }

      // Otherwise, try proactive discovery (path-aware) for servers that support
      // dynamic client registration.
      const mcpServerCredentials = await McpAuthService.discoverOAuthCredentials(deployment.server.runtimeUri[0]);
      if (!isActive()) {
        return;
      }
      if (mcpServerCredentials) {
        setMcpOAuthCredentials(mcpServerCredentials);
        setAuthState(McpServerAuthState.DYNAMIC_REGISTRATION_FLOW);
        return;
      }

      // Otherwise, we can assume that the server is authorized
      setAuthState(McpServerAuthState.AUTHORIZED);
    },
    [ApiService, authState, definitionId, deployment, transportError]
  );

  useEffect(() => {
    let active = true;
    void determineAuthFlow(() => active);
    return () => {
      active = false;
    };
  }, [determineAuthFlow]);

  useEffect(() => {
    if (!isAuthorized || !runtimeUri || transportError) {
      setConnection(undefined);
      return;
    }

    const service = getMcpService(deployment, definitionKey, authCredentials);
    if (!service) {
      setConnection(undefined);
      return;
    }

    setConnection({ deployment, definitionKey, authCredentials, runtimeUri, transport, service });
    return () => {
      service.closeConnection();
    };
  }, [isAuthorized, deployment, definitionKey, authCredentials, runtimeUri, transport, transportError]);

  const makeApiSpec = useCallback(
    async (isActive: IsActive) => {
      if (!isAuthorized || !mcpService || !definition.data) {
        return;
      }

      try {
        setIsSpecLoading(true);
        setError(undefined);
        setApiSpec(undefined);
        const spec = await mcpService.collectMcpSpec();
        if (!isActive()) {
          return;
        }
        const reader = await getSpecReader(spec, {
          ...definition.data,
          specification: {
            ...definition.data.specification,
            // TODO: this probably needs to be more robust
            name: 'mcp',
          },
        });
        if (isActive()) {
          setApiSpec(reader);
        }
      } catch (err) {
        if (!isActive()) {
          return;
        }
        if (err instanceof McpUnauthorizedError && err.wwwAuthenticate) {
          const serverUri = deployment.server.runtimeUri[0];
          const discoveryResult = await McpAuthService.discoverFromWwwAuthenticate(err.wwwAuthenticate, serverUri);
          if (!isActive()) {
            return;
          }

          // Check if this is an MSAL/Entra ID discovery result
          if (discoveryResult && 'type' in discoveryResult && discoveryResult.type === 'msal') {
            const config = getRecoil(configAtom);
            if (!config.mcp?.enableEntraIdAuth) {
              setError(
                'The MCP server requires Entra ID authentication. ' +
                  'Enable it in config.json: { "mcp": { "enableEntraIdAuth": true } }'
              );
              return;
            }

            mcpService.closeConnection();

            try {
              const token = await McpMsalAuthService.acquireToken(discoveryResult.scopes, discoveryResult.authority);
              if (!isActive()) {
                return;
              }
              if (token) {
                setApiSpec(undefined);
                setError(undefined);
                setAuthCredentials({
                  name: 'Authorization',
                  value: `Bearer ${token}`,
                  in: 'header',
                  createdAt: new Date(),
                });
                setAuthState(McpServerAuthState.AUTHORIZED);
                return;
              }

              // Silent returned undefined — needs user interaction
              setMsalDiscoveredAuth(discoveryResult);
              setAuthState(McpServerAuthState.MSAL_CONSENT_NEEDED);
            } catch (msalErr) {
              if (!isActive()) {
                return;
              }
              const message = msalErr instanceof Error ? msalErr.message : 'Unknown error';
              setError(`Authentication failed: ${message}`);
            }
            return;
          }

          // Dynamic registration flow (Oauth2Credentials)
          if (discoveryResult) {
            setApiSpec(undefined);
            setError(undefined);
            mcpService.closeConnection();
            setMcpOAuthCredentials(discoveryResult as Oauth2Credentials);
            setAuthState(McpServerAuthState.DYNAMIC_REGISTRATION_FLOW);
            return;
          }

          setError(
            'The MCP server requires authentication. ' +
              'OAuth discovery was attempted but failed — the authorization metadata endpoint may not be reachable from this origin.'
          );
        } else if (err instanceof McpUnauthorizedError) {
          setError('The MCP server requires authentication, but the server did not provide discovery information.');
        } else {
          const isCorsError = err instanceof TypeError && err.message === 'Failed to fetch';
          if (isCorsError) {
            setError(
              'The MCP server blocked the request due to CORS policy. ' +
                'The server does not allow requests from this origin.'
            );
          } else {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to connect to the MCP server: ${message}`);
          }
        }
      } finally {
        if (isActive()) {
          setIsSpecLoading(false);
        }
      }
    },
    [definition.data, deployment, isAuthorized, mcpService]
  );

  useEffect(() => {
    let active = true;
    void makeApiSpec(() => active);
    return () => {
      active = false;
    };
  }, [makeApiSpec]);

  const handleAuthCredentialsChange = useCallback((credentials?: ApiAuthCredentials) => {
    setAuthCredentials(credentials);
    if (!!credentials) {
      setAuthState(McpServerAuthState.AUTHORIZED);
    }
  }, []);

  const handleMsalConsent = useCallback(async () => {
    if (!msalDiscoveredAuth) {
      return;
    }

    try {
      setError(undefined);
      const token = await McpMsalAuthService.acquireTokenInteractive(
        msalDiscoveredAuth.scopes,
        msalDiscoveredAuth.authority
      );
      setAuthCredentials({
        name: 'Authorization',
        value: `Bearer ${token}`,
        in: 'header',
        createdAt: new Date(),
      });
      setAuthState(McpServerAuthState.AUTHORIZED);
    } catch (e) {
      setError(`Authentication failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [msalDiscoveredAuth]);

  if (transportError) {
    return <div className={styles.authPanel}>Failed to connect to the MCP server: {transportError}</div>;
  }

  if (
    authState === McpServerAuthState.NOT_AUTHORIZED ||
    definition.isLoading ||
    isSpecLoading ||
    (isAuthorized && !!runtimeUri && !mcpService && !error)
  ) {
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

  if (authState === McpServerAuthState.MSAL_CONSENT_NEEDED && msalDiscoveredAuth) {
    return (
      <div className={styles.authPanel}>
        <p>This MCP server requires additional permissions.</p>
        <p className={styles.scopesList}>Scopes: {msalDiscoveredAuth.scopes.join(', ')}</p>
        <button className={styles.consentButton} onClick={handleMsalConsent}>
          Sign in to grant access
        </button>
        {error && <p className={styles.authError}>{error}</p>}
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (error) {
    return <div className={styles.authPanel}>{error}</div>;
  }

  return (
    <McpAuthProvider credentials={authCredentials}>
      <ApiSpecPageLayout definitionId={definitionId} deployment={deployment} apiSpec={apiSpec} />
    </McpAuthProvider>
  );
};

export default React.memo(McpSpecPage);
