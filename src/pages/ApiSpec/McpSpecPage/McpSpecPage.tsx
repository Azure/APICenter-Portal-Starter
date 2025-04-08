import React, { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@fluentui/react-components';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import McpService from '@/services/McpService';
import { ApiSpecReader } from '@/types/apiSpec';
import getSpecReader from '@/specReaders/getSpecReader';
import useApiDefinition from '@/hooks/useApiDefinition';
import ApiSpecPageLayout from '../ApiSpecPageLayout';
import pageStyles from '../ApiSpec.module.scss';

interface Props {
  definitionId: ApiDefinitionId;
  deployment: ApiDeployment;
}

export const McpSpecPage: React.FC<Props> = ({ definitionId, deployment }) => {
  const [isSpecLoading, setIsSpecLoading] = useState(false);
  const [apiSpec, setApiSpec] = useState<ApiSpecReader>();
  const mcpService = McpService.getInstance(deployment.server.runtimeUri[0]);
  const definition = useApiDefinition(definitionId);

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

  if (definition.isLoading || isSpecLoading) {
    return <Spinner className={pageStyles.spinner} />;
  }

  return <ApiSpecPageLayout definitionId={definitionId} deployment={deployment} apiSpec={apiSpec} />;
};

export default React.memo(McpSpecPage);
