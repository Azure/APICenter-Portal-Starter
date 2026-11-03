import React from 'react';
import McpSpecPage, { McpSpecPageProps } from './McpSpecPage';

const McpSpecPageBoundary: React.FC<McpSpecPageProps> = (props) => {
  const { definitionId, deployment } = props;
  const key = JSON.stringify([
    definitionId?.resourceType,
    definitionId?.apiName,
    definitionId?.versionName,
    definitionId?.definitionName,
    deployment?.name,
    deployment?.server?.runtimeUri?.[0],
    deployment?.server?.mcpTransportProtocol,
  ]);
  return <McpSpecPage key={key} {...props} />;
};

export default McpSpecPageBoundary;
