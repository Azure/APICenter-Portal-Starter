import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Spinner, Tab, TabList } from '@fluentui/react-components';
import { DocumentRegular, TagRegular, WindowConsoleRegular } from '@fluentui/react-icons';
import { useApi } from '@/hooks/useApi';
import { useServer } from '@/hooks/useServer';
import { useMcpTransportTags } from '@/hooks/useMcpTransportTags';
import { kindToResourceType, ApiDefinitionId } from '@/types/apiDefinition';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout, BreadcrumbItem } from '@/components/DetailPageLayout/DetailPageLayout';
import ApiDefinitionSelect, { ApiDefinitionSelection } from '@/experiences/ApiDefinitionSelect';
import ApiAdditionalInfo from '@/experiences/ApiAdditionalInfo';
import { HeaderActions } from '@/experiences/HeaderActions';
import { getLifecycleBadgeColor, formatLifecycleStage } from '@/utils/badgeSystem';
import McpSpecPage from '@/pages/ApiSpec/McpSpecPage';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { InstallationBlock } from '@/components/InstallationBlock';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';

export const McpServerDetailPage: React.FC = () => {
  const { apiName } = useParams<{ apiName: string }>();
  const api = useApi(apiName);
  const [definitionSelection, setDefinitionSelection] = useState<ApiDefinitionSelection | undefined>();
  const [selectedTab, setSelectedTab] = useState<string>('documentation');

  setDocumentTitle(`MCP server${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const kind = api.data?.kind;

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [
    { label: 'Home', href: '/' },
    { label: 'MCP servers', href: '/?kind=mcp' },
    { label: api.data?.title || apiName || '...' },
  ], [api.data?.title, apiName]);

  const hiddenSelects = ['definition', 'deployment'] as Array<keyof ApiDefinitionSelection>;

  const server = useServer(apiName);

  const customPropertyTags = useMemo(() => {
    const props = api.data?.customProperties;
    if (!props) return [];
    const tags: string[] = [];
    const skip = new Set(['sourceUrl']);
    for (const [key, val] of Object.entries(props)) {
      if (skip.has(key)) continue;
      if (typeof val === 'string') {
        val.split(',').forEach(t => {
          const trimmed = t.trim();
          if (trimmed && trimmed.length <= 50 && !/^https?:\/\//.test(trimmed) && !/^[0-9a-f-]{36}$/i.test(trimmed)) {
            tags.push(trimmed);
          }
        });
      } else if (Array.isArray(val)) {
        val.forEach(item => {
          if (typeof item === 'string' && item.trim() && item.trim().length <= 50) tags.push(item.trim());
        });
      }
    }
    return tags;
  }, [api.data?.customProperties]);

  const hasRemoteInstall = !!definitionSelection?.deployment?.server.runtimeUri.length;
  const hasLocalInstall = !!server.data?.packages;
  const hasInstall = hasRemoteInstall || hasLocalInstall;

  const transportTags = useMcpTransportTags(apiName ? [apiName] : []);
  const transportBadge = apiName ? transportTags[apiName]?.[0] : undefined;

  const handleMcpInstall = useCallback((target?: 'remote' | 'local') => {
    const useRemote = target ? target === 'remote' : hasRemoteInstall;
    const baseName = api.data?.title || apiName || '';

    if (useRemote && hasRemoteInstall) {
      const runtimeUri = definitionSelection?.deployment?.server.runtimeUri[0];
      if (!runtimeUri) return;
      const matchingRemote = server.data?.remotes?.find((r) => r.url === runtimeUri);
      const transportType = matchingRemote?.transport_type || 'sse';
      const payload = {
        name: hasLocalInstall ? `${baseName} (remote)` : baseName,
        type: transportType,
        url: runtimeUri,
      };
      window.open(`vscode:mcp/install?${encodeURIComponent(JSON.stringify(payload))}`);
    } else if (hasLocalInstall) {
      const [pkg] = server.data!.packages!;
      if (!pkg) return;
      const runtimeArgs = (pkg.runtimeArguments ?? []).map((arg: { value?: string }) => arg.value).filter(Boolean);
      const packageRef = pkg.version ? `${pkg.identifier}@${pkg.version}` : pkg.identifier;
      const args = pkg.runtimeHint === 'npx' ? ['-y', packageRef, ...runtimeArgs] : runtimeArgs;
      const localBase = baseName || pkg.identifier.split('/').pop() || pkg.identifier;
      const payload = {
        name: hasRemoteInstall ? `${localBase} (local)` : localBase,
        type: pkg.transport?.type || 'stdio',
        command: pkg.runtimeHint,
        args,
      };
      window.open(`vscode:mcp/install?${encodeURIComponent(JSON.stringify(payload))}`);
    }
  }, [api.data?.title, apiName, definitionSelection?.deployment?.server.runtimeUri, server.data, hasRemoteInstall, hasLocalInstall]);

  // Copyable endpoint URL for devs to use in CLI / other tools
  const endpointUrl = useMemo(() => {
    const deploymentUri = definitionSelection?.deployment?.server.runtimeUri[0];
    if (deploymentUri) return deploymentUri;
    const remoteUrl = server.data?.remotes?.[0]?.url;
    if (remoteUrl) return remoteUrl;
    return undefined;
  }, [definitionSelection?.deployment?.server.runtimeUri, server.data?.remotes]);

  const definitionId = useMemo<ApiDefinitionId | undefined>(() => {
    if (!apiName || !definitionSelection?.version?.name || !definitionSelection?.definition?.name) return undefined;
    return {
      apiName,
      versionName: definitionSelection.version.name,
      definitionName: definitionSelection.definition.name,
      resourceType: kindToResourceType(kind),
    };
  }, [apiName, definitionSelection?.version?.name, definitionSelection?.definition?.name, kind]);

  function renderInstallationBlock() {
    if (!endpointUrl) return null;
    return (
      <InstallationBlock
        assetType="mcp"
        endpointUrl={endpointUrl}
        assetName={api.data?.name || apiName || 'mcp-server'}
      />
    );
  }

  function renderTestConsole() {
    if (!definitionId) return null;
    if (!definitionSelection?.deployment) {
      return <Spinner size="small" label="Loading documentation..." labelPosition="below" />;
    }
    return (
      <McpSpecPage
        definitionId={definitionId}
        deployment={definitionSelection.deployment}
      />
    );
  }

  return (
    <DetailPageLayout
      title={api.data?.title}
      summary={api.data?.summary}
      breadcrumbs={breadcrumbs}
      metadata={
        <>
          <Badge appearance="filled" color="brand" shape="circular">
            MCP
          </Badge>
          {transportBadge && (
            <Badge appearance="tint" color="brand" shape="circular">{transportBadge}</Badge>
          )}
          {api.data?.lifecycleStage && (
            <Badge appearance="tint" color={getLifecycleBadgeColor(api.data.lifecycleStage)} shape="circular">
              {formatLifecycleStage(api.data.lifecycleStage)}
            </Badge>
          )}
          {customPropertyTags.length > 0 && (
            <>
              <TagRegular style={{ fontSize: 16, color: 'var(--colorNeutralForeground3)', flexShrink: 0 }} />
              {customPropertyTags.map(tag => (
                <Badge key={tag} appearance="tint" color="informative" shape="circular">
                  {tag}
                </Badge>
              ))}
            </>
          )}
        </>
      }
      lastUpdated={api.data?.lastUpdated}
      tabs={
        <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as string)}>
          <Tab icon={<DocumentRegular />} value="documentation">Documentation</Tab>
          {hasRemoteInstall && <Tab icon={<WindowConsoleRegular />} value="testconsole">Test console</Tab>}
        </TabList>
      }
      selector={
        apiName && api.data ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
            <ApiDefinitionSelect
              apiId={apiName}
              resourceType={kindToResourceType(api.data.kind)}
              hiddenSelects={hiddenSelects}
              isInline
              onSelectionChange={setDefinitionSelection}
            />
          </div>
        ) : undefined
      }
      headerActions={
        hasInstall ? (
          <HeaderActions showExtensionHint>
            <Button
              icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
              onClick={() => handleMcpInstall()}
            >
              Install in VS Code
            </Button>
          </HeaderActions>
        ) : undefined
      }
      isLoading={api.isLoading}
      error={api.isError ? 'Failed to load MCP server details. Please check your connection and try again.' : undefined}
      onRetry={() => api.refetch()}
      emptyMessage={!api.isLoading && !api.isError && !api.data ? 'The specified MCP server does not exist.' : undefined}
      sidebar={undefined}
    >
      {api.data && selectedTab === 'documentation' && (
        <>
          {renderInstallationBlock()}
          {api.data.description && api.data.description !== api.data.summary && (
            <MarkdownRenderer markdown={api.data.description} />
          )}
          <ApiAdditionalInfo api={api.data} />
        </>
      )}
      {api.data && selectedTab === 'testconsole' && hasRemoteInstall && renderTestConsole()}
    </DetailPageLayout>
  );
};

export default React.memo(McpServerDetailPage);
