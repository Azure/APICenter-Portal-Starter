import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Tab, TabList } from '@fluentui/react-components';
import { CodeRegular, DocumentRegular } from '@fluentui/react-icons';
import { useApi } from '@/hooks/useApi';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout } from '@/components/DetailPageLayout/DetailPageLayout';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CustomMetadata from '@/components/CustomMetadata';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import { AgentDefinition } from '@/experiences/AgentDefinition';

type AgentTab = 'documentation' | 'definition' | 'properties';

export const AgentInfo: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const api = useApi(name);
  const [selectedTab, setSelectedTab] = useState<AgentTab>('documentation');

  setDocumentTitle(`Agent${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const hasCustomProps = !!Object.keys(api.data?.customProperties || {}).length;

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
      tabs={
        <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as AgentTab)}>
          <Tab icon={<DocumentRegular />} value="documentation">
            Documentation
          </Tab>
          <Tab icon={<CodeRegular />} value="definition">
            Definition
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
          <MarkdownRenderer markdown={(api.data.description || api.data.summary)!} />
        ) : (
          <EmptyStateMessage>No description available for this agent.</EmptyStateMessage>
        ))}

      {api.data && selectedTab === 'definition' && <AgentDefinition agentName={api.data.name} />}

      {api.data && selectedTab === 'properties' && hasCustomProps && (
        <CustomMetadata value={api.data.customProperties} />
      )}
    </DetailPageLayout>
  );
};

export default React.memo(AgentInfo);
