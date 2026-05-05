import React, { useState } from 'react';
import { Button, Tab, TabList, Tooltip } from '@fluentui/react-components';
import { CopyRegular, CheckmarkRegular, ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons';
import styles from './ConnectBar.module.scss';

/** Escape HTML special chars so angle brackets in placeholders don't get stripped */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Simple JSON syntax highlighter — colors keys, strings, and punctuation */
function highlightJson(json: string): string {
  return json.replace(
    /("(?:\\.|[^"\\])*")\s*(:)?|(\btrue\b|\bfalse\b|\bnull\b)|(\d+)/g,
    (match, str, colon, keyword, num) => {
      if (str && colon) {
        return `<span class="${styles.jsonKey}">${escapeHtml(str)}</span>:`;
      }
      if (str) {
        return `<span class="${styles.jsonString}">${escapeHtml(str)}</span>`;
      }
      if (keyword) {
        return `<span class="${styles.jsonKeyword}">${keyword}</span>`;
      }
      if (num) {
        return `<span class="${styles.jsonNumber}">${num}</span>`;
      }
      return escapeHtml(match);
    }
  );
}

interface ConnectBarProps {
  dataApiHostName?: string;
  docsUrl?: string;
}

export const ConnectBar: React.FC<ConnectBarProps> = ({
  dataApiHostName,
  docsUrl = 'https://learn.microsoft.com/en-us/azure/api-center/',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<'vscode' | 'cli'>('vscode');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const mcpEndpoint = dataApiHostName ? `https://${dataApiHostName}/mcp` : '';

  const handleCopy = (text: string, field: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const mcpConfig = JSON.stringify({
    servers: {
      'api-center': {
        url: mcpEndpoint,
        type: 'http',
      },
    },
    inputs: [],
  }, null, 2);

  const cliCommand = `/mcp add ${mcpEndpoint}`;

  return (
    <div className={styles.connectBar}>
      <div className={styles.collapsed} onClick={() => setExpanded(!expanded)}>
        <span className={styles.statusDot} />
        <span className={styles.title}>Connect to API Center MCP</span>
        <code className={styles.url}>{mcpEndpoint}</code>
        <Tooltip content={copiedField === 'url' ? 'Copied!' : 'Copy endpoint'} relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={copiedField === 'url' ? <CheckmarkRegular /> : <CopyRegular />}
            onClick={(e) => { e.stopPropagation(); handleCopy(mcpEndpoint, 'url'); }}
            aria-label="Copy endpoint"
            className={styles.copyBtn}
          />
        </Tooltip>
        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.docsLink}
            onClick={(e) => e.stopPropagation()}
          >
            Learn more →
          </a>
        )}
        <Button
          appearance="subtle"
          size="small"
          icon={expanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
          className={styles.expandBtn}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        />
      </div>

      {expanded && (
        <div className={styles.expandedContent}>
          <TabList
            size="small"
            selectedValue={tab}
            onTabSelect={(_, d) => setTab(d.value as 'vscode' | 'cli')}
            className={styles.tabList}
          >
            <Tab value="vscode">VS Code</Tab>
            <Tab value="cli">CLI</Tab>
          </TabList>

          {tab === 'vscode' && (
            <div className={styles.tabContent}>
              <span className={styles.hint}>Add to your VS Code settings.json under <code>mcp</code></span>
              <div className={styles.codeBlock}>
                <Tooltip content={copiedField === 'config' ? 'Copied!' : 'Copy config'} relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={copiedField === 'config' ? <CheckmarkRegular /> : <CopyRegular />}
                    onClick={() => handleCopy(mcpConfig, 'config')}
                    aria-label="Copy config"
                    className={styles.codeBlockCopyBtn}
                  />
                </Tooltip>
                <div className={styles.lineNumbers}>
                  {mcpConfig.split('\n').map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
                <pre className={styles.codeContent}>
                  <code dangerouslySetInnerHTML={{ __html: highlightJson(mcpConfig) }} />
                </pre>
              </div>
            </div>
          )}

          {tab === 'cli' && (
            <div className={styles.tabContent}>
              <span className={styles.hint}>Run in GitHub Copilot CLI or Claude Code:</span>
              <div className={styles.commandRow}>
                <code className={styles.command}>{cliCommand}</code>
                <Tooltip content={copiedField === 'cli' ? 'Copied!' : 'Copy'} relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={copiedField === 'cli' ? <CheckmarkRegular /> : <CopyRegular />}
                    onClick={() => handleCopy(cliCommand, 'cli')}
                    aria-label="Copy CLI command"
                    className={styles.copyBtn}
                  />
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ConnectBar);
