import React from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from '@fluentui/react-components';
import { useApi } from '@/hooks/useApi';
import { setDocumentTitle } from '@/utils/dom';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { SkillInstallButton } from '@/experiences/SkillInstallButton';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import styles from './SkillInfo.module.scss';

/** Hardcoded source URL for skill installation deeplinks. */
const SKILL_SOURCE_URL = 'https://github.com/vercel-labs/agent-skills/tree/main/skills';

export const SkillInfo: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const api = useApi(name);

  setDocumentTitle(`Skill${api.data?.title ? ` - ${api.data.title}` : ''}`);

  if (api.isLoading) {
    return (
      <div className={styles.skillInfo}>
        <Spinner className={styles.spinner} size="large" label="Loading..." labelPosition="below" />
      </div>
    );
  }

  if (!api.data) {
    return (
      <div className={styles.skillInfo}>
        <section>
          <EmptyStateMessage>The specified skill does not exist.</EmptyStateMessage>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.skillInfo}>
      <div className={styles.header}>
        <section>
          <h1>{api.data.title}</h1>
          {api.data.summary && (
            <p className={styles.lastUpdated}>
              {api.data.summary}
            </p>
          )}
        </section>
      </div>

      <section>
        <div className={styles.content}>
          <div className={styles.description}>
            {(api.data.description || api.data.summary) ? (
              <MarkdownRenderer markdown={(api.data.description || api.data.summary)!} />
            ) : (
              <EmptyStateMessage>No description available for this skill.</EmptyStateMessage>
            )}
          </div>

          <aside className={styles.sidebar}>
            <SkillInstallButton skillName={api.data.name} sourceUrl={SKILL_SOURCE_URL} />
          </aside>
        </div>
      </section>
    </div>
  );
};

export default React.memo(SkillInfo);
