import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Badge, Button, Link, Spinner, Tab, TabList } from '@fluentui/react-components';
import { Open16Regular } from '@fluentui/react-icons';
import { DocumentRegular } from '@fluentui/react-icons';
import { useApi } from '@/hooks/useApi';
import { useServer } from '@/hooks/useServer';
import { kindToResourceType, ApiDefinitionId } from '@/types/apiDefinition';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout } from '@/components/DetailPageLayout/DetailPageLayout';
import ApiDefinitionSelect, { ApiDefinitionSelection } from '@/experiences/ApiDefinitionSelect';
import CustomMetadata from '@/components/CustomMetadata';
import { HeaderActions } from '@/experiences/HeaderActions';
import { formatKindDisplay } from '@/utils/formatKind';
import { buildSkillDeeplink } from '@/utils/skillDeeplink';
import { useApiSpec } from '@/hooks/useApiSpec';
import ApiSpecPageLayout from '@/pages/ApiSpec/ApiSpecPageLayout';
import McpSpecPage from '@/pages/ApiSpec/McpSpecPage';
import EmptyStateMessage from '@/components/EmptyStateMessage';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';

export const ApiDetailPage: React.FC = () => {
  const { apiName } = useParams<{ apiName: string }>();
  const api = useApi(apiName);
  const [definitionSelection, setDefinitionSelection] = useState<ApiDefinitionSelection | undefined>();
  const [selectedTab, setSelectedTab] = useState<string>('documentation');

  setDocumentTitle(`API${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const kind = api.data?.kind;
  const STANDALONE_KINDS = ['skill', 'a2a', 'mcp', 'plugin', 'agent', 'languagemodel'];
  const isStandaloneKind = kind ? STANDALONE_KINDS.includes(kind.toLowerCase()) : false;
  const categoryLabel = isStandaloneKind ? formatKindDisplay(kind!) : 'API';

  const hiddenSelects = ['mcp', 'skill', 'plugin'].includes(kind ?? '')
    ? (['definition', 'deployment'] as Array<keyof ApiDefinitionSelection>)
    : [];

  const server = useServer(kind === 'mcp' ? apiName : undefined);

  const skillSourceUrl = useMemo(
    () => api.data?.customProperties?.['sourceUrl'] as string | undefined,
    [api.data]
  );

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

  // MCP install
  const hasRemoteInstall = kind === 'mcp' && !!definitionSelection?.deployment?.server.runtimeUri.length;
  const hasLocalInstall = kind === 'mcp' && !!server.data?.packages;
  const hasMcpInstall = hasRemoteInstall || hasLocalInstall;

  const handleMcpInstall = useCallback(() => {
    const preferRemote = hasRemoteInstall;

    if (preferRemote) {
      const runtimeUri = definitionSelection?.deployment?.server.runtimeUri[0];
      if (!runtimeUri) return;
      const matchingRemote = server.data?.remotes?.find((r) => r.url === runtimeUri);
      const transportType = matchingRemote?.transport_type || 'sse';
      const payload = {
        name: api.data?.title || apiName || '',
        type: transportType,
        url: runtimeUri,
      };
      window.open(`vscode:mcp/install?${encodeURIComponent(JSON.stringify(payload))}`);
    } else if (hasLocalInstall) {
      const [pkg] = server.data!.packages!;
      if (!pkg) return;
      const runtimeArgs = pkg.runtimeArguments.map((arg: { value?: string }) => arg.value).filter(Boolean);
      const args = pkg.runtimeHint === 'npx' ? ['-y', pkg.identifier, ...runtimeArgs] : runtimeArgs;
      const payload = {
        name: api.data?.title || pkg.identifier.split('/').pop() || pkg.identifier,
        type: pkg.transport?.type || 'stdio',
        command: pkg.runtimeHint,
        args,
      };
      window.open(`vscode:mcp/install?${encodeURIComponent(JSON.stringify(payload))}`);
    }
  }, [api.data?.title, apiName, definitionSelection?.deployment?.server.runtimeUri, server.data, hasRemoteInstall, hasLocalInstall]);

  // Skill install
  const handleSkillInstall = useCallback(() => {
    if (!skillSourceUrl || !api.data?.name) return;
    const deeplink = buildSkillDeeplink({ sourceUrl: skillSourceUrl, name: api.data.name }, 'vscode');
    window.open(deeplink);
  }, [skillSourceUrl, api.data?.name]);

  const hasInstall = hasMcpInstall || (kind === 'skill' && !!skillSourceUrl);

  const isMcp = kind === 'mcp';

  const hasCustomProps = !!Object.keys(api.data?.customProperties || {}).length;

  // Left sidebar: only external docs and contacts (no properties — those go in a tab)
  const sidebarExtra = useMemo(() => {
    if (!api.data) return undefined;
    const hasExternalDocs = !!api.data.externalDocumentation?.length;
    const hasContacts = !!api.data.contacts?.length;
    if (!hasExternalDocs && !hasContacts) return undefined;

    const sections: string[] = [];
    if (hasExternalDocs) sections.push('docs');
    if (hasContacts) sections.push('contacts');

    return (
      <Accordion multiple defaultOpenItems={sections}>
        {hasExternalDocs && (
          <AccordionItem value="docs">
            <AccordionHeader as="h4" size="large">
              <strong>External documentation</strong>
            </AccordionHeader>
            <AccordionPanel>
              {api.data.externalDocumentation!.filter(d => !!d.title && d.url).map(doc => (
                <Link key={doc.title} href={doc.url.startsWith('http') ? doc.url : `https://${doc.url}`} target="_blank" style={{ display: 'block' }}>
                  {doc.title} <Open16Regular />
                </Link>
              ))}
            </AccordionPanel>
          </AccordionItem>
        )}
        {hasContacts && (
          <AccordionItem value="contacts">
            <AccordionHeader as="h4" size="large">
              <strong>Contact information</strong>
            </AccordionHeader>
            <AccordionPanel>
              {api.data.contacts!.map(contact => (
                <React.Fragment key={contact.name}>
                  {contact.url && (
                    <Link href={contact.url.startsWith('http') ? contact.url : `https://${contact.url}`} target="_blank" style={{ display: 'block' }}>
                      {contact.name} <Open16Regular />
                    </Link>
                  )}
                  {!contact.url && !!contact.email && (
                    <Link href={`mailto:${contact.email}`} target="_blank" style={{ display: 'block' }}>
                      {contact.name} <Open16Regular />
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </AccordionPanel>
          </AccordionItem>
        )}
      </Accordion>
    );
  }, [api.data]);

  const definitionId = useMemo<ApiDefinitionId | undefined>(() => {
    if (!apiName || !definitionSelection?.version?.name || !definitionSelection?.definition?.name) return undefined;
    return {
      apiName,
      versionName: definitionSelection.version.name,
      definitionName: definitionSelection.definition.name,
      resourceType: kindToResourceType(api.data?.kind),
    };
  }, [apiName, definitionSelection?.version?.name, definitionSelection?.definition?.name, api.data?.kind]);

  const apiSpec = useApiSpec(definitionId ?? { apiName: '', versionName: '', definitionName: '' });

  function renderDocumentation() {
    if (!definitionId) return null;

    if (isMcp) {
      if (!definitionSelection?.deployment) {
        return <Spinner size="small" label="Loading documentation..." labelPosition="below" />;
      }
      return (
        <McpSpecPage
          definitionId={definitionId}
          deployment={definitionSelection.deployment}
          sidebarExtra={sidebarExtra}
        />
      );
    }

    if (apiSpec.isLoading) {
      return <Spinner size="small" label="Loading documentation..." labelPosition="below" />;
    }

    if (apiSpec.isError || !apiSpec.data?.type) {
      return <EmptyStateMessage>Documentation is not available for this API.</EmptyStateMessage>;
    }

    return (
      <ApiSpecPageLayout
        definitionId={definitionId}
        deployment={definitionSelection?.deployment}
        apiSpec={apiSpec.data}
        sidebarExtra={sidebarExtra}
      />
    );
  }

  return (
    <DetailPageLayout
      title={api.data?.title}
      summary={api.data?.summary}
      metadata={
        <>
          <Badge appearance="filled" color="brand" shape="circular">
            {categoryLabel}
          </Badge>
          {kind && !isStandaloneKind && (
            <Badge appearance="tint" color="brand" shape="circular">
              {formatKindDisplay(kind)}
            </Badge>
          )}
          {api.data?.lifecycleStage && (
            <Badge appearance="tint" color="brand" shape="circular">
              {api.data.lifecycleStage}
            </Badge>
          )}
          {customPropertyTags.map(tag => (
            <Badge key={tag} appearance="tint" color="brand" shape="circular">
              {tag}
            </Badge>
          ))}
          {api.data?.lastUpdated && <span>Last updated {new Date(api.data.lastUpdated).toLocaleDateString()}</span>}
        </>
      }
      tabs={
        <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as string)}>
          <Tab icon={<DocumentRegular />} value="documentation">Documentation</Tab>
          {hasCustomProps && <Tab value="properties">Additional properties</Tab>}
        </TabList>
      }
      selector={
        apiName && api.data ? (
          <ApiDefinitionSelect
            apiId={apiName}
            resourceType={kindToResourceType(api.data.kind)}
            hiddenSelects={hiddenSelects}
            isInline
            onSelectionChange={setDefinitionSelection}
          />
        ) : undefined
      }
      headerActions={
        hasInstall ? (
          <HeaderActions showExtensionHint>
            {hasMcpInstall && (
              <Button
                size="medium"
                icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
                onClick={handleMcpInstall}
              >
                Install in VS Code
              </Button>
            )}
            {kind === 'skill' && skillSourceUrl && (
              <Button
                size="medium"
                icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
                onClick={handleSkillInstall}
              >
                Install in VS Code
              </Button>
            )}
          </HeaderActions>
        ) : undefined
      }
      isLoading={api.isLoading}
      error={api.isError ? 'Failed to load API details. Please check your connection and try again.' : undefined}
      onRetry={() => api.refetch()}
      emptyMessage={!api.isLoading && !api.isError && !api.data ? 'The specified API does not exist.' : undefined}
      sidebar={undefined}
    >
      {api.data && selectedTab === 'documentation' && renderDocumentation()}
      {api.data && selectedTab === 'properties' && (
        <CustomMetadata value={api.data.customProperties} />
      )}
    </DetailPageLayout>
  );
};

export default React.memo(ApiDetailPage);
