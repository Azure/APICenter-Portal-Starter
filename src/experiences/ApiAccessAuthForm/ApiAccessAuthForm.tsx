import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiAuthCredentials, ApiAuthType } from '@/types/apiAuth';
import useApiAuthorization from '@/hooks/useApiAuthorization';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { ApiAuthForm } from '@/components/ApiAuthForm/ApiAuthForm';

interface Props {
  definitionId: ApiDefinitionId;
  onChange: (credentials?: ApiAuthCredentials) => void;
}

export const ApiAccessAuthForm: React.FC<Props> = ({ definitionId, onChange }) => {
  const [selectedScheme, setSelectedScheme] = useState<string>();

  const apiAuth = useApiAuthorization({
    definitionId,
    schemeName: selectedScheme,
  });

  // Trigger onChange when new credentials are available
  useEffect(() => {
    onChange(apiAuth.credentials);
  }, [apiAuth.credentials, onChange]);

  const handleOauthRequested = useCallback(
    (flow: string) => {
      void apiAuth.authenticateWithOauth(flow);
    },
    [apiAuth]
  );

  const authOptions = useMemo(
    () =>
      apiAuth.schemeOptions?.map((option) => ({
        name: option.name,
        title: option.title,
        type: option.securityScheme,
      })) || [],
    [apiAuth.schemeOptions]
  );

  return (
    <ApiAuthForm
      authOptions={authOptions}
      credentials={apiAuth.credentials}
      selectedAuthOptionName={selectedScheme}
      supportedOauthFlows={
        apiAuth.scheme?.securityScheme === ApiAuthType.oauth2 ? apiAuth.scheme.oauth2.supportedFlows : undefined
      }
      authError={apiAuth.authError}
      isAuthenticating={apiAuth.isLoading && !!apiAuth.scheme}
      isLoading={apiAuth.isLoading && !apiAuth.scheme}
      onAuthOptionChange={setSelectedScheme}
      onOauthRequested={handleOauthRequested}
    />
  );
};

export default React.memo(ApiAccessAuthForm);
