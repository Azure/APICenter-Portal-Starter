import React, { useCallback, useMemo, useState } from 'react';
import { ApiAuthCredentials, ApiAuthType, Oauth2Credentials } from '@/types/apiAuth';
import ApiAuthForm from '@/components/ApiAuthForm';
import { OAuthService } from '@/services/OAuthService';

interface Props {
  credentials: Oauth2Credentials;
  onChange: (credentials?: ApiAuthCredentials) => void;
}

export const McpMetadataBasedAuthForm: React.FC<Props> = ({ credentials, onChange }) => {
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

        // TODO: we should not really use proxy for oauth
        const token = await OAuthService.authenticate(credentials, flow, true);

        if (token !== undefined) {
          onChange({ name: 'Authorization', value: token, in: 'header', createdAt: new Date() });
        }
      } catch (e) {
        setAuthError(e.message);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [credentials, onChange]
  );

  return (
    <ApiAuthForm
      authOptions={authOptions}
      selectedAuthOptionName={selectedScheme}
      supportedOauthFlows={credentials.supportedFlows}
      authError={authError}
      isAuthenticating={isAuthenticating}
      onAuthOptionChange={setSelectedScheme}
      onOauthRequested={handleAuthRequested}
    />
  );
};

export default React.memo(McpMetadataBasedAuthForm);
