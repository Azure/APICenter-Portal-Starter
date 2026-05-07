import React, { useMemo } from 'react';
import { MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components';
import * as yaml from 'yaml';
import { UseQueryResult } from '@tanstack/react-query';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import styles from './AgentDefinition.module.scss';

interface Props {
  definition: UseQueryResult<string | undefined>;
  hasVersion: boolean;
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

interface ParsedDefinition {
  frontmatter?: Record<string, unknown>;
  body: string;
}

function parseDefinition(markdown: string): ParsedDefinition {
  const match = markdown.match(FRONTMATTER_REGEX);
  if (!match) {
    return { body: markdown };
  }

  try {
    const parsed = yaml.parse(match[1]);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { frontmatter: parsed as Record<string, unknown>, body: markdown.slice(match[0].length) };
    }
  } catch {
    // Fall through and render the original markdown as-is.
  }

  return { body: markdown };
}

function formatFrontmatterValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className={styles.emptyValue}>—</span>;
  }
  if (Array.isArray(value)) {
    if (!value.length) return <span className={styles.emptyValue}>—</span>;
    return (
      <div className={styles.tagList}>
        {value.map((item, i) => (
          <code key={i} className={styles.tag}>
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </code>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return <pre className={styles.codeBlock}>{JSON.stringify(value, null, 2)}</pre>;
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return <code className={styles.tag}>{String(value)}</code>;
  }
  return String(value);
}

function renderFrontmatterTable(data: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(data);
  if (!entries.length) return null;

  return (
    <table className={styles.frontmatterTable}>
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key}>
            <th scope="row">{key}</th>
            <td>{formatFrontmatterValue(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const AgentDefinition: React.FC<Props> = ({ definition, hasVersion }) => {
  const parsed = useMemo<ParsedDefinition | undefined>(
    () => (definition.data ? parseDefinition(definition.data) : undefined),
    [definition.data]
  );

  if (!hasVersion) {
    return <EmptyStateMessage>No definition available for this agent.</EmptyStateMessage>;
  }

  if (definition.isLoading) {
    return <Spinner size="small" label="Loading definition..." />;
  }

  if (definition.isError) {
    return (
      <MessageBar intent="error" className={styles.errorBar}>
        <MessageBarBody>Failed to load the agent definition.</MessageBarBody>
      </MessageBar>
    );
  }

  if (!parsed) {
    return <EmptyStateMessage>This version has no definition.</EmptyStateMessage>;
  }

  return (
    <div className={styles.container}>
      {parsed.frontmatter && renderFrontmatterTable(parsed.frontmatter)}
      {parsed.body.trim() ? (
        <div className={styles.markdown}>
          <MarkdownRenderer markdown={parsed.body} />
        </div>
      ) : (
        !parsed.frontmatter && <EmptyStateMessage>This version has no definition.</EmptyStateMessage>
      )}
    </div>
  );
};

export default React.memo(AgentDefinition);
