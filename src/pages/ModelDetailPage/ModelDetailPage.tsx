import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Tab, TabList } from '@fluentui/react-components';
import { ChatRegular, DocumentRegular } from '@fluentui/react-icons';
import { useLanguageModel } from '@/hooks/useLanguageModel';
import { useApiDeployments } from '@/hooks/useApiDeployments';
import { getLifecycleBadgeColor, formatLifecycleStage } from '@/utils/badgeSystem';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout, BreadcrumbItem } from '@/components/DetailPageLayout/DetailPageLayout';
import ApiAdditionalInfo from '@/experiences/ApiAdditionalInfo';
import { ModelChatPlayground } from '@/components/ModelChatPlayground';
import { ApiMetadata } from '@/types/api';

import MarkdownRenderer from '@/components/MarkdownRenderer';
import styles from './ModelDetailPage.module.scss';

export const ModelDetailPage: React.FC = () => {
  const { apiName } = useParams<{ apiName: string }>();
  const model = useLanguageModel(apiName);
  const deployments = useApiDeployments(apiName, 'models');
  const [selectedTab, setSelectedTab] = useState<string>('documentation');

  setDocumentTitle(`Model${model.data?.title ? ` - ${model.data.title}` : ''}`);

  const hasDeployment = (deployments.data ?? []).length > 0;

  const runtimeUrl = useMemo(() => {
    const list = deployments.data ?? [];
    const preferred = list.find((d) => d.recommended) ?? list[0];
    return preferred?.server?.runtimeUri?.[0];
  }, [deployments.data]);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [
    { label: 'Home', href: '/' },
    { label: 'Models', href: '/?kind=model' },
    { label: model.data?.title || apiName || '...' },
  ], [model.data?.title, apiName]);

  const hasModelDetails = !!(
    model.data?.modelProvider || model.data?.modelName ||
    model.data?.contextWindow?.inputTokens != null ||
    model.data?.contextWindow?.outputTokens != null ||
    model.data?.taskTypes?.length || model.data?.inputTypes?.length || model.data?.outputTypes?.length
  );

  return (
    <DetailPageLayout
      title={model.data?.title}
      summary={model.data?.summary}
      breadcrumbs={breadcrumbs}
      metadata={
        <>
          <Badge appearance="filled" color="brand" shape="circular">Model</Badge>
          {model.data?.lifecycleStage && (
            <Badge appearance="tint" color={getLifecycleBadgeColor(model.data.lifecycleStage)} shape="circular">
              {formatLifecycleStage(model.data.lifecycleStage)}
            </Badge>
          )}
        </>
      }
      lastUpdated={model.data?.lastUpdated}
      tabs={
        <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as string)}>
          <Tab icon={<DocumentRegular />} value="documentation">Documentation</Tab>
          {hasDeployment && <Tab icon={<ChatRegular />} value="playground">Test console</Tab>}
        </TabList>
      }

      isLoading={model.isLoading}
      error={model.isError ? 'Failed to load model details. Please check your connection and try again.' : undefined}
      onRetry={() => model.refetch()}
      emptyMessage={!model.isLoading && !model.isError && !model.data ? 'The specified model does not exist.' : undefined}
      sidebar={undefined}
    >
      {model.data && selectedTab === 'documentation' && (
        <>
          {hasModelDetails && (
            <div className={styles.modelProperties}>
              <dl className={styles.detailsGrid}>
                {model.data.modelProvider && (
                  <>
                    <dt>Provider</dt>
                    <dd>{model.data.modelProvider}</dd>
                  </>
                )}
                {model.data.modelName && (
                  <>
                    <dt>Model name</dt>
                    <dd>{model.data.modelName}</dd>
                  </>
                )}
                {model.data.contextWindow?.inputTokens != null && (
                  <>
                    <dt>Input tokens</dt>
                    <dd>{model.data.contextWindow.inputTokens.toLocaleString()}</dd>
                  </>
                )}
                {model.data.contextWindow?.outputTokens != null && (
                  <>
                    <dt>Output tokens</dt>
                    <dd>{model.data.contextWindow.outputTokens.toLocaleString()}</dd>
                  </>
                )}
                {!!model.data.taskTypes?.length && (
                  <>
                    <dt>Task types</dt>
                    <dd>
                      <div className={styles.badges}>
                        {model.data.taskTypes.map((t) => (
                          <Badge key={t} appearance="tint" color="informative" shape="circular">{t}</Badge>
                        ))}
                      </div>
                    </dd>
                  </>
                )}
                {!!model.data.inputTypes?.length && (
                  <>
                    <dt>Input types</dt>
                    <dd>{model.data.inputTypes.join(', ')}</dd>
                  </>
                )}
                {!!model.data.outputTypes?.length && (
                  <>
                    <dt>Output types</dt>
                    <dd>{model.data.outputTypes.join(', ')}</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {(model.data.description || model.data.summary) && (
            <MarkdownRenderer markdown={(model.data.description || model.data.summary)!} />
          )}

          <ApiAdditionalInfo api={model.data as ApiMetadata} />
        </>
      )}

      {model.data && selectedTab === 'playground' && hasDeployment && runtimeUrl && (
        <ModelChatPlayground
          runtimeUrl={runtimeUrl}
          modelTitle={model.data.title || apiName || 'Model'}
          modelName={model.data.modelName}
        />
      )}
    </DetailPageLayout>
  );
};

export default React.memo(ModelDetailPage);
