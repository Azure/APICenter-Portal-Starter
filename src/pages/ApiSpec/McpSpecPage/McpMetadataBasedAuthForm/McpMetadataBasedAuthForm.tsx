import React, { useCallback, useMemo, useState } from 'react';
import { McpServerAuthMetadata } from '@/types/mcp';
import { ApiAuthCredentials, ApiAuthType } from '@/types/apiAuth';
import ApiAuthForm from '@/components/ApiAuthForm';
import OAuthService from '@/services/OAuthService';

interface Props {
  metadata: McpServerAuthMetadata;
  onChange: (credentials?: ApiAuthCredentials) => void;
}

export const McpMetadataBasedAuthForm: React.FC<Props> = ({ metadata, onChange }) => {
  const [selectedScheme, setSelectedScheme] = useState<string>();
  const [authError, setAuthError] = useState<string | undefined>();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authOptions = useMemo(
    () => [
      {
        name: 'oauth2',
        title: 'OAuth 2.0',
        type: ApiAuthType.oauth2,
      },
    ],
    []
  );

  const handleAuthRequested = useCallback(
    async (flow: string) => {
      try {
        setIsAuthenticating(true);

        const token = await OAuthService.authenticate(
          {
            clientId: metadata.client_id,
            authorizationUrl: metadata.authorization_endpoint,
            tokenUrl: metadata.token_endpoint,
            supportedScopes: metadata.scopes_supported,
            supportedFlows: metadata.grant_types_supported,
          },
          flow,
          true
        );

        if (token !== undefined) {
          onChange({ name: 'Authorization', value: token, in: 'header', createdAt: new Date() });
        }
      } catch (e) {
        setAuthError(e.message);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [metadata, onChange]
  );

  return (
    <ApiAuthForm
      authOptions={authOptions}
      selectedAuthOptionName={selectedScheme}
      supportedOauthFlows={metadata.grant_types_supported}
      authError={authError}
      isAuthenticating={isAuthenticating}
      onAuthOptionChange={setSelectedScheme}
      onOauthRequested={handleAuthRequested}
    />
  );
};

export default React.memo(McpMetadataBasedAuthForm);
