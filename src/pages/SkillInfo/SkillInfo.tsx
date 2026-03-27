import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Tab, TabList } from '@fluentui/react-components';
import { DocumentRegular } from '@fluentui/react-icons';
import { useApi } from '@/hooks/useApi';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout } from '@/components/DetailPageLayout/DetailPageLayout';
import { HeaderActions } from '@/experiences/HeaderActions';
import { buildSkillDeeplink } from '@/utils/skillDeeplink';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ApiAdditionalInfo from '@/experiences/ApiAdditionalInfo';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';

/** Hardcoded source URL for skill installation deeplinks. */
const SKILL_SOURCE_URL = 'https://github.com/vercel-labs/agent-skills/tree/main/skills';

export const SkillInfo: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const api = useApi(name);

  setDocumentTitle(`Skill${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const skillSourceUrl = useMemo(
    () => (api.data?.customProperties?.['sourceUrl'] as string | undefined) ?? SKILL_SOURCE_URL,
    [api.data]
  );

  const handleSkillInstall = useCallback(() => {
    if (!api.data?.name) return;
    const deeplink = buildSkillDeeplink({ sourceUrl: skillSourceUrl, name: api.data.name }, 'vscode');
    window.open(deeplink);
  }, [skillSourceUrl, api.data?.name]);

  const sidebarContent = useMemo(() => {
    if (!api.data) return undefined;
    const hasExternalDocs = !!api.data.externalDocumentation?.length;
    const hasContacts = !!api.data.contacts?.length;
    const hasCustomProps = !!Object.keys(api.data.customProperties || {}).length;
    if (!hasExternalDocs && !hasContacts && !hasCustomProps) return undefined;
    return <ApiAdditionalInfo api={api.data} />;
  }, [api.data]);

  return (
    <DetailPageLayout
      title={api.data?.title}
      summary={api.data?.summary}
      metadata={
        <>
          <Badge appearance="filled" color="brand" shape="circular">Skill</Badge>
          {api.data?.lastUpdated && <span>Last updated {new Date(api.data.lastUpdated).toLocaleDateString()}</span>}
        </>
      }
      tabs={
        <TabList defaultSelectedValue="documentation">
          <Tab icon={<DocumentRegular />} value="documentation">Documentation</Tab>
        </TabList>
      }
      headerActions={
        <HeaderActions showExtensionHint>
          <Button
            size="medium"
            icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
            onClick={handleSkillInstall}
          >
            Install in VS Code
          </Button>
        </HeaderActions>
      }
      isLoading={api.isLoading}
      error={api.isError ? 'Failed to load skill details. Please check your connection and try again.' : undefined}
      onRetry={() => api.refetch()}
      emptyMessage={!api.isLoading && !api.isError && !api.data ? 'The specified skill does not exist.' : undefined}
      sidebar={sidebarContent}
    >
      {api.data && (
        (api.data.description || api.data.summary) ? (
          <MarkdownRenderer markdown={(api.data.description || api.data.summary)!} />
        ) : (
          <EmptyStateMessage>No description available for this skill.</EmptyStateMessage>
        )
      )}
    </DetailPageLayout>
  );
};

export default React.memo(SkillInfo);
