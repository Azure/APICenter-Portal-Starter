import React, { useCallback, useEffect, useMemo, useState } from 'react';
import TimeAgo from 'react-timeago';
import { Stack } from '@fluentui/react';
import { Button, Field, Select, Spinner } from '@fluentui/react-components';
import { CheckmarkFilled } from '@fluentui/react-icons';
import { ApiAuthCredentials, ApiAuthType } from '@/types/apiAuth';
import styles from './ApiAuthForm.module.scss';

interface AuthOption {
  name: string;
  title: string;
  type: ApiAuthType;
}

interface Props {
  authOptions: AuthOption[];
  credentials?: ApiAuthCredentials;
  selectedAuthOptionName?: string;
  supportedOauthFlows?: string[];
  authError?: string;
  isAuthenticating?: boolean;
  isLoading?: boolean;
  onAuthOptionChange: (name: string) => void;
  onOauthRequested: (flow: string) => void;
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

export const ApiAuthForm: React.FC<Props> = ({
  authOptions,
  credentials,
  selectedAuthOptionName,
  supportedOauthFlows,
  authError,
  isAuthenticating,
  isLoading,
  onAuthOptionChange,
  onOauthRequested,
}) => {
  const [selectedOauthFlow, setSelectedOauthFlow] = useState<string>();

  const authType = useMemo(
    () => authOptions.find(({ name }) => name === selectedAuthOptionName)?.type,
    [authOptions, selectedAuthOptionName]
  );

  // Auto select first oauth2 flow
  useEffect(() => {
    if (authType !== ApiAuthType.oauth2 || !supportedOauthFlows?.length) {
      setSelectedOauthFlow(undefined);
      return;
    }
    setSelectedOauthFlow(supportedOauthFlows[0]);
  }, [authType, supportedOauthFlows]);

  useEffect(() => {
    if (!authOptions.length) {
      return;
    }

    onAuthOptionChange(authOptions[0].name);
  }, [authOptions, onAuthOptionChange]);

  const handleAuthOptionSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onAuthOptionChange(e.target.value);
    },
    [onAuthOptionChange]
  );

  const handleOauthFlowSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOauthFlow(e.target.value);
  }, []);

  const handleAuthBtnClick = useCallback(() => {
    onOauthRequested(selectedOauthFlow);
  }, [onOauthRequested, selectedOauthFlow]);

  function renderAuthBtn() {
    if (authType !== ApiAuthType.oauth2) {
      return null;
    }

    let icon = null;
    if (isAuthenticating) {
      icon = <Spinner size="tiny" />;
    } else if (credentials) {
      icon = <CheckmarkFilled />;
    }

    let status = null;
    if (authError) {
      status = <div className={styles.error}>{authError}</div>;
    } else if (credentials) {
      status = (
        <div className={styles.status}>
          Authenticated <TimeAgo date={credentials.createdAt} formatter={timeAgoFormatter} minPeriod={60} />
        </div>
      );
    }

    return (
      <Stack tokens={{ childrenGap: 10 }} horizontalAlign="start" verticalAlign="center" horizontal>
        <Button icon={icon} onClick={handleAuthBtnClick}>
          {isAuthenticating ? 'Authenticating' : 'Authenticate'}
        </Button>
        {status}
      </Stack>
    );
  }

  return (
    <div className={styles.apiAuthForm}>
      {(!isLoading || !isAuthenticating) && (
        <Field label="Authorization type:">
          <Select value={selectedAuthOptionName} onChange={handleAuthOptionSelect}>
            <option value="">None</option>

            {authOptions.map((auth) => (
              <option key={auth.name} value={auth.name}>
                {auth.title}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {authType === ApiAuthType.oauth2 && supportedOauthFlows?.length && (
        <Field label="Authorization flow:">
          <Select value={selectedOauthFlow} onChange={handleOauthFlowSelect}>
            {supportedOauthFlows.map((flow) => (
              <option key={flow} value={flow}>
                {flow}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {isLoading && <Spinner className={styles.spinner} />}

      {renderAuthBtn()}
    </div>
  );
};

export default React.memo(ApiAuthForm);
