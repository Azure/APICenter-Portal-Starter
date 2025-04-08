import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Spinner } from '@fluentui/react-components';
import ApiAccessAuthForm from '@/experiences/ApiAccessAuthForm';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import getMcpService from '@/services/McpService';
import { ApiSpecReader } from '@/types/apiSpec';
import getSpecReader from '@/specReaders/getSpecReader';
import useApiDefinition from '@/hooks/useApiDefinition';
import useApiAuthorization from '@/hooks/useApiAuthorization';
import { ApiAuthCredentials } from '@/types/apiAuth';
import { McpServerAuthMetadata } from '@/types/mcp';
import ApiSpecPageLayout from '../ApiSpecPageLayout';
import pageStyles from '../ApiSpec.module.scss';
import McpMetadataBasedAuthForm from './McpMetadataBasedAuthForm';
import styles from './McpSpecPage.module.scss';

interface Props {
  definitionId: ApiDefinitionId;
  deployment: ApiDeployment;
}

export const McpSpecPage: React.FC<Props> = ({ definitionId, deployment }) => {
  const [mcpAuthMetadata, setMcpAuthMetadata] = useState<McpServerAuthMetadata | undefined>();
  const [authCredentials, setAuthCredentials] = useState<ApiAuthCredentials | undefined>();
  const [apiSpec, setApiSpec] = useState<ApiSpecReader>();
  const [isSpecLoading, setIsSpecLoading] = useState(false);
  const [isMcpAuthReady, setIsMcpAuthReady] = useState(false);

  const apiAuth = useApiAuthorization({ definitionId });
  const definition = useApiDefinition(definitionId);

  const apiAccessAuthRequired = !apiAuth.isLoading && !!apiAuth.schemeOptions?.length;

  const mcpService = useMemo(() => {
    if (apiAuth.isLoading) {
      return undefined;
    }

    if (apiAccessAuthRequired && !authCredentials) {
      return undefined;
    }

    return getMcpService(deployment.server.runtimeUri[0]);
  }, [apiAuth, apiAccessAuthRequired, authCredentials, deployment]);

  const makeSpec = useCallback(async () => {
    if (!authCredentials) {
      if (apiAccessAuthRequired) {
        return;
      }

      if (isMcpAuthReady && mcpAuthMetadata) {
        return;
      }
    }

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
  }, [apiAccessAuthRequired, authCredentials, definition.value, isMcpAuthReady, mcpAuthMetadata, mcpService]);

  useEffect(() => {
    if (!mcpService || authCredentials) {
      return;
    }

    mcpService.getAuthMetadata().then((authMetadata: McpServerAuthMetadata) => {
      setMcpAuthMetadata(authMetadata);
      setIsMcpAuthReady(true);
    });
  }, [authCredentials, mcpService]);

  useEffect(() => {
    void makeSpec();
  }, [makeSpec]);

  useEffect(() => {
    if (!mcpService) {
      return;
    }
    mcpService.setAuthCredentials(authCredentials);
  }, [authCredentials, mcpService]);

  if (definition.isLoading || apiAuth.isLoading || isSpecLoading) {
    return <Spinner className={pageStyles.spinner} />;
  }

  if (apiAccessAuthRequired && !authCredentials) {
    return (
      <div className={styles.authPanel}>
        <ApiAccessAuthForm definitionId={definitionId} onChange={setAuthCredentials} />
      </div>
    );
  }

  if (mcpAuthMetadata && !authCredentials) {
    return (
      <div className={styles.authPanel}>
        <McpMetadataBasedAuthForm metadata={mcpAuthMetadata} onChange={setAuthCredentials} />
      </div>
    );
  }

  return <ApiSpecPageLayout definitionId={definitionId} deployment={deployment} apiSpec={apiSpec} />;
};

export default React.memo(McpSpecPage);
