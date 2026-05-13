import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Tab, TabList } from '@fluentui/react-components';
import { DocumentRegular } from '@fluentui/react-icons';
import { useRecoilValue } from 'recoil';
import { useApi } from '@/hooks/useApi';
import { useSkillEvaluationResult } from '@/hooks/useSkillEvaluationResult';
import { configAtom } from '@/atoms/configAtom';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout, BreadcrumbItem } from '@/components/DetailPageLayout/DetailPageLayout';
import { HeaderActions } from '@/experiences/HeaderActions';
import { SkillEvaluationDetails } from '@/experiences/SkillEvaluation';
import { buildSkillDeeplink } from '@/utils/skillDeeplink';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CustomMetadata from '@/components/CustomMetadata';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import { ConnectPanel } from '@/components/ConnectPanel';
import { InstallationBlock } from '@/components/InstallationBlock';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';

/** Hardcoded source URL for skill installation deeplinks. */
const SKILL_SOURCE_URL = 'https://github.com/vercel-labs/agent-skills/tree/main/skills';

export const SkillInfo: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const api = useApi(name);
  const config = useRecoilValue(configAtom);
  const evalResult = useSkillEvaluationResult(name);
  const [selectedTab, setSelectedTab] = useState<string>('documentation');

  setDocumentTitle(`Skill${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [
    { label: 'Home', href: '/' },
    { label: 'Skills', href: '/?kind=skill' },
    { label: api.data?.title || name || '...' },
  ], [api.data?.title, name]);
  const skillSourceUrl = useMemo(
    () => (api.data?.customProperties?.['sourceUrl'] as string | undefined) ?? SKILL_SOURCE_URL,
    [api.data]
  );

  const handleSkillInstall = useCallback(() => {
    if (!api.data?.name) return;
    const deeplink = buildSkillDeeplink({ sourceUrl: skillSourceUrl, name: api.data.name }, 'vscode');
    window.open(deeplink);
  }, [skillSourceUrl, api.data?.name]);

  const hasCustomProps = !!Object.keys(api.data?.customProperties || {}).length;

  return (
    <DetailPageLayout
      title={api.data?.title}
      summary={api.data?.summary}
      breadcrumbs={breadcrumbs}
      metadata={
        <Badge appearance="filled" color="brand" shape="circular">Skill</Badge>
      }
      lastUpdated={api.data?.lastUpdated}
      tabs={
        <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as string)}>
          <Tab icon={<DocumentRegular />} value="documentation">Documentation</Tab>
          {evalResult.data && (
            <Tab value="assessment">
              Assessment
              {evalResult.data.maxScore > 0 && (
                <Badge
                  appearance="filled"
                  color={
                    (evalResult.data.overallScore / evalResult.data.maxScore) >= 0.8 ? 'success'
                    : (evalResult.data.overallScore / evalResult.data.maxScore) >= 0.6 ? 'warning'
                    : 'danger'
                  }
                  shape="circular"
                  style={{ marginLeft: 8 }}
                >
                  {((evalResult.data.overallScore / evalResult.data.maxScore) * 5).toFixed(1)}/5
                </Badge>
              )}
            </Tab>
          )}
          {hasCustomProps && <Tab value="properties">Additional properties</Tab>}
        </TabList>
      }
      headerActions={
        skillSourceUrl ? (
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
      error={api.isError ? 'Failed to load skill details. Please check your connection and try again.' : undefined}
      onRetry={() => api.refetch()}
      emptyMessage={!api.isLoading && !api.isError && !api.data ? 'The specified skill does not exist.' : undefined}
      sidebar={undefined}
    >
      {api.data && selectedTab === 'documentation' && (
        <>
          <InstallationBlock
            assetType="skill"
            assetName={api.data?.name || name || 'skill'}
            dataApiHostName={config.dataApiHostName}
          />
          {(api.data.description || api.data.summary) ? (
            <MarkdownRenderer markdown={(api.data.description || api.data.summary)!} />
          ) : (
            <EmptyStateMessage>No description available for this skill.</EmptyStateMessage>
          )}
        </>
      )}
      {selectedTab === 'assessment' && (
        <SkillEvaluationDetails evalResult={evalResult.data} isLoading={evalResult.isLoading} />
      )}
      {api.data && selectedTab === 'properties' && (
        <CustomMetadata value={api.data.customProperties} />
      )}
    </DetailPageLayout>
  );
};

export default React.memo(SkillInfo);
