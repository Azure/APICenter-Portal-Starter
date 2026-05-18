import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Tab, TabList } from '@fluentui/react-components';
import { DocumentRegular } from '@fluentui/react-icons';
import { useRecoilValue } from 'recoil';
import { useApi } from '@/hooks/useApi';
import { useSkillEvaluationResult } from '@/hooks/useSkillEvaluationResult';
import { getEvalScore } from '@/types/evaluation';
import { configAtom } from '@/atoms/configAtom';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout, BreadcrumbItem } from '@/components/DetailPageLayout/DetailPageLayout';
import { HeaderActions } from '@/experiences/HeaderActions';
import { EvaluationDetails } from '@/experiences/EvaluationDetails';
import { buildSkillDeeplink } from '@/utils/skillDeeplink';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CustomMetadata from '@/components/CustomMetadata';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import { ConnectPanel } from '@/components/ConnectPanel';
import { InstallationBlock } from '@/components/InstallationBlock';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';

/** Hardcoded source URL for skill installation deeplinks. */
const SKILL_SOURCE_URL = 'https://github.com/vercel-labs/agent-skills/tree/main/skills';

/** Skill-specific descriptions for known L0/L1 assertion names. */
const SKILL_ASSERTION_DESCRIPTIONS: Record<string, string> = {
  'frontmatter-present': 'Verifies that the SKILL.md file begins with a valid YAML frontmatter block.',
  'has-name': 'Checks that the frontmatter declares a skill name.',
  'has-description': 'Checks that the frontmatter includes a description field.',
  'body-not-empty': 'Ensures the SKILL.md body contains meaningful content beyond the frontmatter.',
  'has-instructions-section': 'Verifies that the skill file contains an explicit instructions section.',
  'has-examples-section': 'Checks for an examples section demonstrating usage patterns.',
  'has-error-handling-section': 'Checks for a section describing error handling and edge cases.',
};

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
          {evalResult.data && (() => {
            const { overallScore, maxScore } = getEvalScore(evalResult.data);
            return (
              <Tab value="assessment">
                Assessment
                {maxScore > 0 && (
                  <Badge
                    appearance="filled"
                    color={
                      (overallScore / maxScore) >= 0.8 ? 'success'
                      : (overallScore / maxScore) >= 0.6 ? 'warning'
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
        <EvaluationDetails evalResult={evalResult.data} isLoading={evalResult.isLoading} assertionDescriptions={SKILL_ASSERTION_DESCRIPTIONS} />
      )}
      {api.data && selectedTab === 'properties' && (
        <CustomMetadata value={api.data.customProperties} />
      )}
    </DetailPageLayout>
  );
};

export default React.memo(SkillInfo);
