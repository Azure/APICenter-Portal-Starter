import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Dropdown, Link, Option, Tab, TabList } from '@fluentui/react-components';
import { ArrowDownloadRegular, CodeRegular, DocumentRegular } from '@fluentui/react-icons';
import { useApi } from '@/hooks/useApi';
import { useAgentVersions } from '@/hooks/useAgentVersions';
import { useAgentDefinition } from '@/hooks/useAgentDefinition';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout } from '@/components/DetailPageLayout/DetailPageLayout';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CustomMetadata from '@/components/CustomMetadata';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import { AgentDefinition } from '@/experiences/AgentDefinition';
import styles from './AgentInfo.module.scss';

type AgentTab = 'documentation' | 'definition' | 'properties';

const NO_VERSION_LABEL = "Version isn't available";

export const AgentInfo: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const api = useApi(name);
  const versions = useAgentVersions(api.data?.name);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>();
  const [selectedTab, setSelectedTab] = useState<AgentTab>('definition');

  setDocumentTitle(`Agent${api.data?.title ? ` - ${api.data.title}` : ''}`);

  // Auto-select the first version once versions load.
  useEffect(() => {
    if (!selectedVersion && versions.data && versions.data.length > 0) {
      setSelectedVersion(versions.data[0].name);
    }
  }, [versions.data, selectedVersion]);

  const definition = useAgentDefinition(api.data?.name, selectedVersion);

  const handleVersionChange = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>((_, data) => {
    const next = data.optionValue ?? data.selectedOptions[0];
    if (next) setSelectedVersion(next);
  }, []);

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      if (!api.data?.name || !selectedVersion || !definition.data) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const blob = new Blob([definition.data], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${api.data.name}-${selectedVersion}-definition.md`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        // Defer revoke so the click is processed first.
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }
    },
    [api.data?.name, selectedVersion, definition.data]
  );

  const versionOptions = useMemo(() => versions.data ?? [], [versions.data]);
  const selectedVersionTitle = useMemo(
    () => versionOptions.find((v) => v.name === selectedVersion)?.title ?? selectedVersion ?? NO_VERSION_LABEL,
    [versionOptions, selectedVersion]
  );

  const hasCustomProps = !!Object.keys(api.data?.customProperties || {}).length;
  const hasDefinition = !!definition.data;

  const headerSelector =
    versionOptions.length > 0 ? (
      <div className={styles.headerSelector}>
        <div className={styles.selectionDropdown}>
          <label htmlFor="agent-version-select">Version</label>
          <Dropdown
            id="agent-version-select"
            className={styles.dropdown}
            placeholder="Select agent version"
            size="small"
            value={selectedVersionTitle}
            selectedOptions={selectedVersion ? [selectedVersion] : []}
            disabled={!versionOptions.length}
            onOptionSelect={handleVersionChange}
          >
            {versionOptions.map((v) => (
              <Option key={v.name} value={v.name}>
                {v.title || v.name}
              </Option>
            ))}
          </Dropdown>
        </div>
        {hasDefinition && (
          <Link className={styles.downloadLink} href="#" onClick={handleDownload}>
            <ArrowDownloadRegular /> Download definition
          </Link>
        )}
      </div>
    ) : undefined;

  return (
    <DetailPageLayout
      title={api.data?.title}
      summary={api.data?.summary}
      metadata={
        <>
          <Badge appearance="filled" color="brand" shape="circular">
            Agent
          </Badge>
          {api.data?.lifecycleStage && (
            <Badge appearance="tint" color="brand" shape="circular">
              {api.data.lifecycleStage}
            </Badge>
          )}
          {api.data?.lastUpdated && <span>Last updated {new Date(api.data.lastUpdated).toLocaleDateString()}</span>}
        </>
      }
      selector={headerSelector}
      tabs={
        <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as AgentTab)}>
          <Tab icon={<CodeRegular />} value="definition">
            Definition
          </Tab>
          <Tab icon={<DocumentRegular />} value="documentation">
            Documentation
          </Tab>
          {hasCustomProps && <Tab value="properties">Additional properties</Tab>}
        </TabList>
      }
      isLoading={api.isLoading}
      error={api.isError ? 'Failed to load agent details. Please check your connection and try again.' : undefined}
      emptyMessage={!api.isLoading && !api.isError && !api.data ? 'The specified agent does not exist.' : undefined}
      sidebar={undefined}
      onRetry={() => api.refetch()}
    >
      {api.data &&
        selectedTab === 'documentation' &&
        (api.data.description || api.data.summary ? (
          <div className={styles.markdown}>
            <MarkdownRenderer markdown={(api.data.description || api.data.summary)!} />
          </div>
        ) : (
          <EmptyStateMessage>No description available for this agent.</EmptyStateMessage>
        ))}

      {api.data && selectedTab === 'definition' && (
        <AgentDefinition definition={definition} hasVersion={!!selectedVersion} />
      )}

      {api.data && selectedTab === 'properties' && hasCustomProps && (
        <CustomMetadata value={api.data.customProperties} />
      )}
    </DetailPageLayout>
  );
};

export default React.memo(AgentInfo);
