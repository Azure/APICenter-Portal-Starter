import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Dropdown, Field, Link, Option, Tab, TabList } from '@fluentui/react-components';
import { ArrowDownloadRegular, CodeRegular, DocumentRegular, ListRegular, TagRegular } from '@fluentui/react-icons';
import { useApi } from '@/hooks/useApi';
import { kindToResourceType, ApiDefinitionId } from '@/types/apiDefinition';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout, BreadcrumbItem } from '@/components/DetailPageLayout/DetailPageLayout';
import ApiDefinitionSelect, { ApiDefinitionSelection } from '@/experiences/ApiDefinitionSelect';
import ApiAdditionalInfo from '@/experiences/ApiAdditionalInfo';
import { HeaderActions } from '@/experiences/HeaderActions';
import { formatKindDisplay } from '@/utils/formatKind';
import { getLifecycleBadgeColor, formatLifecycleStage } from '@/utils/badgeSystem';
import { buildSkillDeeplink } from '@/utils/skillDeeplink';
import { useApiSpec } from '@/hooks/useApiSpec';
import { useApiSpecUrl } from '@/hooks/useApiSpecUrl';
import { useApiDefinitions } from '@/hooks/useApiDefinitions';
import ApiSpecPageLayout from '@/pages/ApiSpec/ApiSpecPageLayout';
import EmptyStateMessage from '@/components/EmptyStateMessage';
import { useRecoilValue } from 'recoil';
import { configAtom } from '@/atoms/configAtom';
import { InstallationBlock } from '@/components/InstallationBlock';
import { Spinner } from '@fluentui/react-components';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';

export const ApiDetailPage: React.FC = () => {
  const { apiName } = useParams<{ apiName: string }>();
  const api = useApi(apiName);
  const config = useRecoilValue(configAtom);
  const [definitionSelection, setDefinitionSelection] = useState<ApiDefinitionSelection | undefined>();
  const [selectedTab, setSelectedTab] = useState<string>('properties');

  setDocumentTitle(`API${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const kind = api.data?.kind;
  const STANDALONE_KINDS = ['skill', 'a2a', 'plugin', 'agent', 'languagemodel'];
  const isStandaloneKind = kind ? STANDALONE_KINDS.includes(kind.toLowerCase()) : false;
  const categoryLabel = isStandaloneKind ? formatKindDisplay(kind!) : 'API';

  const CATEGORY_PLURALS: Record<string, string> = {
    rest: 'APIs', graphql: 'APIs', grpc: 'APIs', soap: 'APIs',
    skill: 'Skills', plugin: 'Plugins', agent: 'Agents', a2a: 'Agents', languagemodel: 'Models',
  };
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const categoryPlural = CATEGORY_PLURALS[kind?.toLowerCase() ?? ''] ?? 'APIs';
    return [
      { label: 'Home', href: '/' },
      { label: categoryPlural, href: `/?kind=${kind?.toLowerCase() ?? ''}` },
      { label: api.data?.title || apiName || '...' },
    ];
  }, [kind, api.data?.title, apiName]);

  const hiddenSelects = ['skill', 'plugin'].includes(kind ?? '')
    ? (['definition', 'deployment'] as Array<keyof ApiDefinitionSelection>)
    : (['definition'] as Array<keyof ApiDefinitionSelection>);

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

  // Skill install
  const handleSkillInstall = useCallback(() => {
    if (!skillSourceUrl || !api.data?.name) return;
    const deeplink = buildSkillDeeplink({ sourceUrl: skillSourceUrl, name: api.data.name }, 'vscode');
    window.open(deeplink);
  }, [skillSourceUrl, api.data?.name]);

  const hasInstall = kind === 'skill' && !!skillSourceUrl;

  // Copyable endpoint URL for devs to use in CLI / other tools
  const endpointUrl = useMemo(() => {
    // Skill: sourceUrl from custom properties
    if (kind === 'skill' && skillSourceUrl) return skillSourceUrl;
    // General APIs: runtimeUri from deployment
    const deploymentUri = definitionSelection?.deployment?.server.runtimeUri[0];
    if (deploymentUri) return deploymentUri;
    return undefined;
  }, [kind, definitionSelection?.deployment?.server.runtimeUri, skillSourceUrl]);

  const hasCustomProps = !!Object.keys(api.data?.customProperties || {}).length;
  const hasExternalDocs = !!api.data?.externalDocumentation?.filter(d => !!d.title && d.url).length;
  const hasContacts = !!api.data?.contacts?.length;
  const hasAdditionalInfo = hasCustomProps || hasExternalDocs || hasContacts;

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

  // Download definition — fetch available definitions and spec URL
  const apiDefinitions = useApiDefinitions(apiName, definitionSelection?.version?.name, kindToResourceType(api.data?.kind));
  const apiSpecUrl = useApiSpecUrl(definitionId ?? { apiName: '', versionName: '', definitionName: '' });
  const DOWNLOAD_EXCLUDED_KINDS = ['mcp', 'skill', 'plugin', 'languagemodel'];
  const showDownloadDefinition = kind && !DOWNLOAD_EXCLUDED_KINDS.includes(kind.toLowerCase()) && !!definitionSelection?.definition;

  const [downloadDefinitionName, setDownloadDefinitionName] = useState<string | undefined>();

  const handleDownloadDefinitionSelect = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>(
    (_, data) => {
      setDownloadDefinitionName(data.selectedOptions[0]);
    },
    []
  );

  // Build download URL for selected definition type
  const downloadDefinitionId = useMemo<ApiDefinitionId | undefined>(() => {
    if (!apiName || !definitionSelection?.version?.name) return undefined;
    const defName = downloadDefinitionName || definitionSelection?.definition?.name;
    if (!defName) return undefined;
    return {
      apiName,
      versionName: definitionSelection.version.name,
      definitionName: defName,
      resourceType: kindToResourceType(api.data?.kind),
    };
  }, [apiName, definitionSelection?.version?.name, downloadDefinitionName, definitionSelection?.definition?.name, api.data?.kind]);

  const downloadSpecUrl = useApiSpecUrl(downloadDefinitionId ?? { apiName: '', versionName: '', definitionName: '' });

  function renderInstallationBlock() {
    const kindLower = kind?.toLowerCase();
    if (kindLower === 'plugin') {
      return (
        <InstallationBlock
          assetType="plugin"
          assetName={api.data?.name || apiName || 'plugin'}
          dataApiHostName={config.dataApiHostName}
        />
      );
    }
    if (kindLower === 'skill') {
      return (
        <InstallationBlock
          assetType="skill"
          assetName={api.data?.name || apiName || 'skill'}
          dataApiHostName={config.dataApiHostName}
        />
      );
    }
    return null;
  }

  function renderDocumentation() {
    if (!definitionId) return null;

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
            {categoryLabel}
          </Badge>
          {kind && !isStandaloneKind && (
            <Badge appearance="tint" color="brand" shape="circular">
              {formatKindDisplay(kind)}
            </Badge>
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
          <Tab icon={<DocumentRegular />} value="properties">Documentation</Tab>
          <Tab icon={<CodeRegular />} value="documentation">API specification</Tab>
        </TabList>
      }
      selector={
        apiName && api.data ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', flexWrap: 'wrap' }}>
            <ApiDefinitionSelect
              apiId={apiName}
              resourceType={kindToResourceType(api.data.kind)}
              hiddenSelects={hiddenSelects}
              isInline
              onSelectionChange={setDefinitionSelection}
            />
            {showDownloadDefinition && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <Field label="Download definition" size="small">
                  <Dropdown
                    id="download-definition-select"
                    size="small"
                    placeholder="Select definition type"
                    value={
                      (downloadDefinitionName
                        ? apiDefinitions.data?.find(d => d.name === downloadDefinitionName)?.title
                        : definitionSelection?.definition?.title) || 'Select definition type'
                    }
                    selectedOptions={[downloadDefinitionName || definitionSelection?.definition?.name]}
                    disabled={!apiDefinitions.data?.length}
                    onOptionSelect={handleDownloadDefinitionSelect}
                    style={{ minWidth: '175px' }}
                  >
                    {apiDefinitions.data?.map((def) => (
                      <Option key={def.name} value={def.name}>
                        {def.title}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
                <Link
                  href={downloadSpecUrl.data || '#'}
                  target="_blank"
                  disabled={!downloadSpecUrl.data}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', paddingBottom: '6px' }}
                >
                  <ArrowDownloadRegular /> Download
                </Link>
              </div>
            )}
          </div>
        ) : undefined
      }
      headerActions={
        hasInstall ? (
          <HeaderActions showExtensionHint>
            <Button
              icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
              onClick={handleSkillInstall}
            >
              Install in VS Code
            </Button>
          </HeaderActions>
        ) : undefined
      }
      isLoading={api.isLoading}
      error={api.isError ? 'Failed to load API details. Please check your connection and try again.' : undefined}
      onRetry={() => api.refetch()}
      emptyMessage={!api.isLoading && !api.isError && !api.data ? 'The specified API does not exist.' : undefined}
      sidebar={undefined}
    >
      {api.data && selectedTab === 'properties' && (
        <ApiAdditionalInfo api={api.data} />
      )}
      {api.data && selectedTab === 'documentation' && (
        <>
          {renderInstallationBlock()}
          {renderDocumentation()}
        </>
      )}
    </DetailPageLayout>
  );
};

export default React.memo(ApiDetailPage);
