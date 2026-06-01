import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Tab, TabList } from '@fluentui/react-components';
import { CodeRegular, DocumentRegular } from '@fluentui/react-icons';
import { useRecoilValue } from 'recoil';
import { useApi } from '@/hooks/useApi';
import { useAIAssetVersions } from '@/hooks/useAIAssetVersions';
import { useAIAssetDefinition } from '@/hooks/useAIAssetDefinition';
import { useAIAssetEvaluationResult } from '@/hooks/useAIAssetEvaluationResult';
import { getEvalScore } from '@/types/evaluation';
import { configAtom } from '@/atoms/configAtom';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout, BreadcrumbItem } from '@/components/DetailPageLayout/DetailPageLayout';
import { HeaderActions } from '@/experiences/HeaderActions';
import { VersionSelect } from '@/experiences/VersionSelect';
import { AIAssetDefinition } from '@/experiences/AIAssetDefinition';
import { EvaluationDetails } from '@/experiences/EvaluationDetails';
import { buildSkillDeeplink } from '@/utils/skillDeeplink';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CustomMetadata from '@/components/CustomMetadata';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
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

type SkillTab = 'documentation' | 'definition' | 'assessment' | 'properties';

export const SkillInfo: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const api = useApi(name);
  const config = useRecoilValue(configAtom);
  const versions = useAIAssetVersions(api.data?.name, 'skills');
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>();
  const [selectedTab, setSelectedTab] = useState<SkillTab>('documentation');

  setDocumentTitle(`Skill${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { label: 'Home', href: '/' },
      { label: 'Skills', href: '/?kind=skill' },
      { label: api.data?.title || name || '...' },
    ],
    [api.data?.title, name]
  );

  const skillSourceUrl = useMemo(
    () => (api.data?.customProperties?.['sourceUrl'] as string | undefined) ?? SKILL_SOURCE_URL,
    [api.data]
  );

  // Auto-select the first version once versions load.
  useEffect(() => {
    if (!selectedVersion && versions.data && versions.data.length > 0) {
      setSelectedVersion(versions.data[0].name);
    }
  }, [versions.data, selectedVersion]);

  // Reset selected version when navigating to a different skill.
  useEffect(() => {
    setSelectedVersion(undefined);
  }, [name]);

  const definition = useAIAssetDefinition(api.data?.name, selectedVersion, 'skills');
  const evalResult = useAIAssetEvaluationResult(api.data?.name, selectedVersion, 'skills');

  // Fall back to documentation tab if assessment data disappears after version change.
  useEffect(() => {
    if (selectedTab === 'assessment' && evalResult.isFetched && !evalResult.isFetching && !evalResult.data) {
      setSelectedTab('documentation');
    }
  }, [selectedTab, evalResult.isFetched, evalResult.isFetching, evalResult.data]);

  const handleSkillInstall = useCallback(() => {
    if (!api.data?.name) return;
    const deeplink = buildSkillDeeplink({ sourceUrl: skillSourceUrl, name: api.data.name }, 'vscode');
    window.open(deeplink);
  }, [skillSourceUrl, api.data?.name]);

  const versionOptions = useMemo(() => versions.data ?? [], [versions.data]);
  const hasCustomProps = !!Object.keys(api.data?.customProperties || {}).length;
  const canInstall = !!skillSourceUrl;

  const headerSelector =
    versionOptions.length > 0 ? (
      <VersionSelect
        id="skill-version-select"
        versions={versionOptions}
        selectedName={selectedVersion}
        placeholder="Select skill version"
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
        <Badge appearance="filled" color="brand" shape="circular">
          Skill
        </Badge>
      }
      lastUpdated={api.data?.lastUpdated}
      selector={headerSelector}
      tabs={
        <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as SkillTab)}>
          <Tab icon={<DocumentRegular />} value="documentation">
            Documentation
          </Tab>
          <Tab icon={<CodeRegular />} value="definition">
            Definition
          </Tab>
          {evalResult.data &&
            (() => {
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
      headerActions={
        canInstall ? (
          <HeaderActions showExtensionHint>
            <Button icon={<img height={18} src={VsCodeLogo} alt="VS Code" />} onClick={handleSkillInstall}>
              Install in VS Code
            </Button>
          </HeaderActions>
        ) : undefined
      }
      isLoading={api.isLoading}
      error={api.isError ? 'Failed to load skill details. Please check your connection and try again.' : undefined}
      emptyMessage={!api.isLoading && !api.isError && !api.data ? 'The specified skill does not exist.' : undefined}
      sidebar={undefined}
      onRetry={() => api.refetch()}
    >
      {api.data && selectedTab === 'documentation' && (
        <>
          <InstallationBlock
            assetType="skill"
            assetName={api.data?.name || name || 'skill'}
            dataApiHostName={config.dataApiHostName}
          />
          {api.data.description || api.data.summary ? (
            <MarkdownRenderer markdown={(api.data.description || api.data.summary)!} />
          ) : (
            <EmptyStateMessage>No description available for this skill.</EmptyStateMessage>
          )}
        </>
      )}

      {api.data && selectedTab === 'definition' && (
        <AIAssetDefinition definition={definition} hasVersion={!!selectedVersion} />
      )}

      {selectedTab === 'assessment' && (
        <EvaluationDetails
          evalResult={evalResult.data}
          isLoading={evalResult.isLoading}
          assertionDescriptions={SKILL_ASSERTION_DESCRIPTIONS}
        />
      )}

      {api.data && selectedTab === 'properties' && <CustomMetadata value={api.data.customProperties} />}
    </DetailPageLayout>
  );
};

export default React.memo(SkillInfo);
