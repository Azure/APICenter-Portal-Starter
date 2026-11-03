import React from 'react';
import { getApiDefinitionKey } from '@/utils/apiAuth';
import { McpSpecPage, McpSpecPageProps } from './McpSpecPage';

const McpSpecPageWithDeployment: React.FC<McpSpecPageProps> = (props) => {
  const { definitionId, deployment } = props;
  const key = JSON.stringify([
    getApiDefinitionKey(definitionId),
    deployment?.name,
    deployment?.server?.runtimeUri?.[0],
    deployment?.server?.mcpTransportProtocol,
  ]);
  return React.createElement(McpSpecPage, { ...props, key });
};

export default McpSpecPageWithDeployment;
