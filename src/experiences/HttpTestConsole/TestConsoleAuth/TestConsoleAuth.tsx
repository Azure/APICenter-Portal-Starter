import React, { useCallback, useEffect, useState } from 'react';
import { Field, Select, Spinner } from '@fluentui/react-components';
import { ApiAuthCredentials, ApiAuthType } from '@/types/apiAuth';
import useApiAuthorization from '@/hooks/useApiAuthorization';
import styles from './TestConsoleAuth.module.scss';

interface Props {
  apiName: string;
  versionName: string;
  onChange: (credentials?: ApiAuthCredentials) => void;
}

export const TestConsoleAuth: React.FC<Props> = ({ apiName, versionName, onChange }) => {
  const [selectedScheme, setSelectedScheme] = useState<string>();
  const [selectedOauthFlow, setSelectedOauthFlow] = useState<string>();
  const apiAuth = useApiAuthorization({
    apiName,
    versionName,
    oauthFlow: selectedOauthFlow,
    schemeName: selectedScheme,
  });

  useEffect(() => {
    setSelectedScheme(apiAuth.schemeOptions?.[0]?.name);
  }, [apiAuth.schemeOptions]);

  // Auto select first oauth2 flow
  useEffect(() => {
    if (apiAuth.scheme?.securityScheme !== ApiAuthType.oauth2) {
      setSelectedOauthFlow(undefined);
      return;
    }
    setSelectedOauthFlow(apiAuth.scheme.oauth2.supportedFlows[0]);
  }, [apiAuth.scheme]);

  // Trigger onChange when new credentials are available
  useEffect(() => {
    onChange(apiAuth.credentials);
  }, [apiAuth.credentials, onChange]);

  const handleRequirementSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedScheme(e.target.value);
  }, []);

  const handleOauthFlowSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOauthFlow(e.target.value);
  }, []);

  return (
    <div className={styles.testConsoleAuth}>
      {(!!apiAuth.schemeOptions || !apiAuth.isLoading) && (
        <Field label="Authorization type:">
          <Select value={selectedScheme} onChange={handleRequirementSelect}>
            <option value="">None</option>

            {apiAuth.schemeOptions?.map((auth) => (
              <option key={auth.name} value={auth.name}>
                {auth.title}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {apiAuth.scheme?.securityScheme === ApiAuthType.oauth2 && (
        <Field label="Authorization flow:">
          <Select value={selectedOauthFlow} onChange={handleOauthFlowSelect}>
            {apiAuth.scheme.oauth2.supportedFlows.map((flow) => (
              <option key={flow} value={flow}>
                {flow}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {apiAuth.isLoading && <Spinner className={styles.spinner} />}
    </div>
  );
};

export default React.memo(TestConsoleAuth);
