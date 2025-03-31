import React, { useCallback, useEffect, useState } from 'react';
import TimeAgo from 'react-timeago';
import { Stack } from '@fluentui/react';
import { Button, Field, Select, Spinner } from '@fluentui/react-components';
import { CheckmarkFilled } from '@fluentui/react-icons';
import { ApiAuthCredentials, ApiAuthType } from '@/types/apiAuth';
import useApiAuthorization from '@/hooks/useApiAuthorization';
import styles from './TestConsoleAuth.module.scss';

interface Props {
  apiName: string;
  versionName: string;
  onChange: (credentials?: ApiAuthCredentials) => void;
}

const timeAgoFormatter: React.ComponentProps<typeof TimeAgo>['formatter'] = (
  value: number,
  unit: string,
  suffix: string
) => {
  if (unit === 'second') {
    return 'just now';
  }
  return `${value} ${unit}${value !== 1 ? 's' : ''} ${suffix}`;
};

export const TestConsoleAuth: React.FC<Props> = ({ apiName, versionName, onChange }) => {
  const [selectedScheme, setSelectedScheme] = useState<string>();
  const [selectedOauthFlow, setSelectedOauthFlow] = useState<string>();
  const apiAuth = useApiAuthorization({
    apiName,
    versionName,
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

  const handleAuthBtnClick = useCallback(() => {
    void apiAuth.authenticateWithOauth(selectedOauthFlow);
  }, [apiAuth, selectedOauthFlow]);

  function renderAuthBtn() {
    if (apiAuth.scheme?.securityScheme !== ApiAuthType.oauth2) {
      return null;
    }

    let icon = null;
    if (apiAuth.isLoading) {
      icon = <Spinner size="tiny" />;
    } else if (apiAuth.credentials) {
      icon = <CheckmarkFilled />;
    }

    let status = null;
    if (apiAuth.authError) {
      status = <div className={styles.error}>{apiAuth.authError}</div>;
    } else if (apiAuth.credentials) {
      status = (
        <div className={styles.status}>
          Authenticated <TimeAgo date={apiAuth.credentials.createdAt} formatter={timeAgoFormatter} minPeriod={60} />
        </div>
      );
    }

    return (
      <Stack tokens={{ childrenGap: 10 }} horizontalAlign="start" verticalAlign="center" horizontal>
        <Button icon={icon} onClick={handleAuthBtnClick}>
          {apiAuth.isLoading ? 'Authenticating' : 'Authenticate'}
        </Button>
        {status}
      </Stack>
    );
  }

  return (
    <div className={styles.testConsoleAuth} style={{ width: '400px' }}>
      <h1>Connect to MCP server</h1>
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

      {apiAuth.isLoading && !apiAuth.scheme && <Spinner className={styles.spinner} />}

      {renderAuthBtn()}
    </div>
  );
};

export default React.memo(TestConsoleAuth);
