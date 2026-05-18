import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Tab, TabList } from '@fluentui/react-components';
import { ArrowDownloadRegular, CodeRegular, DocumentRegular } from '@fluentui/react-icons';
import { useApi } from '@/hooks/useApi';
import { useAgentVersions } from '@/hooks/useAgentVersions';
import { useAgentDefinition } from '@/hooks/useAgentDefinition';
import { useAgentEvaluationResult } from '@/hooks/useAgentEvaluationResult';
import { getEvalScore } from '@/types/evaluation';
import { setDocumentTitle } from '@/utils/dom';
import { getLifecycleBadgeColor, formatLifecycleStage } from '@/utils/badgeSystem';
import { DetailPageLayout, BreadcrumbItem } from '@/components/DetailPageLayout/DetailPageLayout';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CustomMetadata from '@/components/CustomMetadata';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import { HeaderActions } from '@/experiences/HeaderActions';
import { VersionSelect } from '@/experiences/VersionSelect';
import { AgentDefinition } from '@/experiences/AgentDefinition';
import { EvaluationDetails } from '@/experiences/EvaluationDetails';
import styles from './AgentInfo.module.scss';

type AgentTab = 'documentation' | 'definition' | 'assessment' | 'properties';

export const AgentInfo: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const api = useApi(name);
  const versions = useAgentVersions(api.data?.name);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>();
  const [selectedTab, setSelectedTab] = useState<AgentTab>('definition');

  setDocumentTitle(`Agent${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { label: 'Home', href: '/' },
      { label: 'Agents', href: '/?kind=agent' },
      { label: api.data?.title || name || '...' },
    ],
    [api.data?.title, name]
  );
  // Auto-select the first version once versions load.
  useEffect(() => {
    if (!selectedVersion && versions.data && versions.data.length > 0) {
      setSelectedVersion(versions.data[0].name);
    }
  }, [versions.data, selectedVersion]);

  // Reset selected version when navigating to a different agent.
  useEffect(() => {
    setSelectedVersion(undefined);
  }, [name]);

  const definition = useAgentDefinition(api.data?.name, selectedVersion);
  const evalResult = useAgentEvaluationResult(api.data?.name, selectedVersion);

  // Fall back to definition tab if assessment data disappears after version change.
  useEffect(() => {
    if (selectedTab === 'assessment' && evalResult.isFetched && !evalResult.isFetching && !evalResult.data) {
      setSelectedTab('definition');
    }
  }, [selectedTab, evalResult.isFetched, evalResult.isFetching, evalResult.data]);

  const handleDownload = useCallback(() => {
    if (!api.data?.name || !selectedVersion || !definition.data) return;
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
  }, [api.data?.name, selectedVersion, definition.data]);

  const versionOptions = useMemo(() => versions.data ?? [], [versions.data]);
  const hasCustomProps = !!Object.keys(api.data?.customProperties || {}).length;
  const hasDefinition = !!definition.data;

  const headerSelector =
    versionOptions.length > 0 ? (
      <VersionSelect
        id="agent-version-select"
        versions={versionOptions}
        selectedName={selectedVersion}
        placeholder="Select agent version"
        isInline
        onChange={setSelectedVersion}
      />
    ) : undefined;

  return (
    <DetailPageLayout
      title={api.data?.title}
      summary={api.data?.summary}
      breadcrumbs={breadcrumbs}
      metadata={
        <>
          <Badge appearance="filled" color="brand" shape="circular">
            Agent
          </Badge>
          {api.data?.lifecycleStage && (
            <Badge appearance="tint" color={getLifecycleBadgeColor(api.data.lifecycleStage)} shape="circular">
              {formatLifecycleStage(api.data.lifecycleStage)}
            </Badge>
          )}
        </>
      }
      lastUpdated={api.data?.lastUpdated}
      selector={headerSelector}
      headerActions={
        hasDefinition ? (
          <HeaderActions>
            <Button icon={<ArrowDownloadRegular />} onClick={handleDownload}>
              Download definition
            </Button>
          </HeaderActions>
        ) : undefined
      }
      tabs={
        <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as AgentTab)}>
          <Tab icon={<CodeRegular />} value="definition">
            Definition
          </Tab>
          <Tab icon={<DocumentRegular />} value="documentation">
            Documentation
          </Tab>
          {evalResult.data && (() => {
            const { overallScore, maxScore } = getEvalScore(evalResult.data);
            return (
              <Tab value="assessment">
                Assessment
                {maxScore > 0 && (
                  <Badge
                    appearance="filled"
                    color={
                      overallScore / maxScore >= 0.8
                        ? 'success'
                        : overallScore / maxScore >= 0.6
                          ? 'warning'
                          : 'danger'
                    }
                    shape="circular"
                    style={{ marginLeft: 8 }}
                  >
                    {((overallScore / maxScore) * 5).toFixed(1)}/5
                  </Badge>
                )}
              </Tab>
            );
          })()}
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

      {selectedTab === 'assessment' && (
        <EvaluationDetails evalResult={evalResult.data} isLoading={evalResult.isLoading} />
      )}

      {api.data && selectedTab === 'properties' && hasCustomProps && (
        <CustomMetadata value={api.data.customProperties} />
      )}
    </DetailPageLayout>
  );
};

export default React.memo(AgentInfo);
