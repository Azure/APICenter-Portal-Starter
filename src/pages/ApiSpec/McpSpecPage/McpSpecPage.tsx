import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Spinner } from '@fluentui/react-components';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import McpService from '@/services/McpService';
import { ApiSpecReader } from '@/types/apiSpec';
import getSpecReader from '@/specReaders/getSpecReader';
import useApiDefinition from '@/hooks/useApiDefinition';
import useApiAuthorization from '@/hooks/useApiAuthorization';
import TestConsoleAuth from '@/experiences/HttpTestConsole/TestConsoleAuth';
import { ApiAuthCredentials } from '@/types/apiAuth';
import ApiSpecPageLayout from '../ApiSpecPageLayout';
import pageStyles from '../ApiSpec.module.scss';
import styles from './McpSpecPage.module.scss';

interface Props {
  definitionId: ApiDefinitionId;
  deployment: ApiDeployment;
}

export const McpSpecPage: React.FC<Props> = ({ definitionId, deployment }) => {
  const [authCredentials, setAuthCredentials] = useState<ApiAuthCredentials | undefined>();
  const [isSpecLoading, setIsSpecLoading] = useState(false);
  const [apiSpec, setApiSpec] = useState<ApiSpecReader>();

  const apiAuth = useApiAuthorization({ definitionId });
  const definition = useApiDefinition(definitionId);

  const apiAuthRequired = !apiAuth.isLoading && !!apiAuth.schemeOptions?.length;

  const mcpService = useMemo(() => {
    if (apiAuth.isLoading) {
      return undefined;
    }

    if (apiAuthRequired && !authCredentials) {
      return undefined;
    }

    return McpService.getInstance(deployment.server.runtimeUri[0], authCredentials);
  }, [apiAuth, apiAuthRequired, authCredentials, deployment]);

  const makeSpec = useCallback(async () => {
    if (!mcpService || !definition.value) {
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
  }, [definition.value, mcpService]);

  useEffect(() => {
    void makeSpec();
  }, [makeSpec]);

  if (definition.isLoading || apiAuth.isLoading || isSpecLoading) {
    return <Spinner className={pageStyles.spinner} />;
  }

  if (apiAuthRequired && !authCredentials) {
    return (
      <div className={styles.authPanel}>
        <TestConsoleAuth definitionId={definitionId} onChange={setAuthCredentials} />
      </div>
    );
  }

  return <ApiSpecPageLayout definitionId={definitionId} deployment={deployment} apiSpec={apiSpec} />;
};

export default React.memo(McpSpecPage);
