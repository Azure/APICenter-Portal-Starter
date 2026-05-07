import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, MessageBar, MessageBarBody, Option, Spinner } from '@fluentui/react-components';
import { ArrowDownloadRegular } from '@fluentui/react-icons';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import { useAgentVersions } from '@/hooks/useAgentVersions';
import { useAgentDefinition } from '@/hooks/useAgentDefinition';
import styles from './AgentDefinition.module.scss';

interface Props {
  agentName: string;
}

export const AgentDefinition: React.FC<Props> = ({ agentName }) => {
  const versions = useAgentVersions(agentName);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>();

  // Auto-select the first version once versions load.
  useEffect(() => {
    if (!selectedVersion && versions.data && versions.data.length > 0) {
      setSelectedVersion(versions.data[0].name);
    }
  }, [versions.data, selectedVersion]);

  const definition = useAgentDefinition(agentName, selectedVersion);

  const handleVersionChange = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>((_, data) => {
    const next = data.optionValue ?? data.selectedOptions[0];
    if (next) setSelectedVersion(next);
  }, []);

  const handleDownload = useCallback(() => {
    if (!selectedVersion || !definition.data) return;
    const blob = new Blob([definition.data], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agentName}-${selectedVersion}-definition.md`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      // Defer revoke so the click is processed first.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }, [agentName, selectedVersion, definition.data]);

  const versionOptions = useMemo(() => versions.data ?? [], [versions.data]);
  const selectedTitle = useMemo(
    () => versionOptions.find((v) => v.name === selectedVersion)?.title ?? selectedVersion ?? '',
    [versionOptions, selectedVersion]
  );

  if (versions.isLoading) {
    return <Spinner size="small" label="Loading versions..." />;
  }

  if (versions.isError) {
    return (
      <MessageBar intent="error" className={styles.errorBar}>
        <MessageBarBody>Failed to load agent versions.</MessageBarBody>
      </MessageBar>
    );
  }

  if (!versionOptions.length) {
    return <EmptyStateMessage>No definition available for this agent.</EmptyStateMessage>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Dropdown
          className={styles.versionSelect}
          aria-label="Agent version"
          value={selectedTitle}
          selectedOptions={selectedVersion ? [selectedVersion] : []}
          onOptionSelect={handleVersionChange}
        >
          {versionOptions.map((v) => (
            <Option key={v.name} value={v.name} text={v.title ?? v.name}>
              {v.title ?? v.name}
            </Option>
          ))}
        </Dropdown>
        <div className={styles.spacer} />
        <Button
          icon={<ArrowDownloadRegular />}
          disabled={!definition.data || definition.isLoading}
          onClick={handleDownload}
        >
          Download
        </Button>
      </div>

      {definition.isLoading && <Spinner size="small" label="Loading definition..." />}

      {definition.isError && (
        <MessageBar intent="error" className={styles.errorBar}>
          <MessageBarBody>Failed to load the agent definition.</MessageBarBody>
        </MessageBar>
      )}

      {!definition.isLoading &&
        !definition.isError &&
        (definition.data ? (
          <MarkdownRenderer markdown={definition.data} />
        ) : (
          <EmptyStateMessage>This version has no definition.</EmptyStateMessage>
        ))}
    </div>
  );
};

export default React.memo(AgentDefinition);
