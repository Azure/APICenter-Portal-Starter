import React, { useState } from 'react';
import { Button, Tooltip, Tab, TabList } from '@fluentui/react-components';
import { CopyRegular, CheckmarkRegular, ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons';
import styles from './EndpointBar.module.scss';

interface EndpointBarProps {
  serviceName?: string;
  region?: string;
  mcpDocsUrl?: string;
  pluginDocsUrl?: string;
}

export const EndpointBar: React.FC<EndpointBarProps> = ({
  serviceName = '<your-service-name>',
  region = '<region>',
  mcpDocsUrl = 'https://learn.microsoft.com/en-us/azure/api-center/',
  pluginDocsUrl = 'https://learn.microsoft.com/en-us/azure/api-center/enable-api-center-plugin-marketplace',
}) => {
  const [mcpExpanded, setMcpExpanded] = useState(false);
  const [pluginExpanded, setPluginExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mcpTab, setMcpTab] = useState<'vscode' | 'cli'>('vscode');

  const mcpEndpoint = `https://${serviceName}.data.${region}.azure-apicenter.ms/mcp`;
  const pluginEndpoint = `https://${serviceName}.data.${region}.azure-apicenter.ms/workspaces/default/plugins/marketplace.git`;

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

  const mcpAddCommand = `/mcp add ${mcpEndpoint}`;

  const pluginCommands = [
    { label: 'Add marketplace', command: `/plugin marketplace add ${pluginEndpoint}` },
    { label: 'Browse plugins', command: `/plugin marketplace browse ${serviceName}` },
    { label: 'Install a plugin', command: `/plugin install <plugin-name>@${serviceName}` },
  ];

  return (
    <div className={styles.endpointSection}>
      {/* MCP Server bar */}
      <div className={styles.endpointBar}>
        <div className={styles.collapsed} onClick={() => setMcpExpanded(!mcpExpanded)}>
          <span className={styles.statusDot} />
          <span className={styles.serverLabel}>API Center MCP server</span>
          <code className={styles.url}>{mcpEndpoint}</code>
          <Tooltip content={copiedField === 'mcp-url' ? 'Copied!' : 'Copy URL'} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={copiedField === 'mcp-url' ? <CheckmarkRegular /> : <CopyRegular />}
              onClick={(e) => { e.stopPropagation(); handleCopy(mcpEndpoint, 'mcp-url'); }}
              aria-label="Copy MCP endpoint URL"
              className={styles.copyBtn}
            />
          </Tooltip>
          {mcpDocsUrl && (
            <a
              href={mcpDocsUrl}
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
            icon={mcpExpanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
            className={styles.expandBtn}
            aria-label={mcpExpanded ? 'Collapse' : 'Expand'}
          />
        </div>

        {mcpExpanded && (
          <div className={styles.expandedContent}>
            <TabList
              size="small"
              selectedValue={mcpTab}
              onTabSelect={(_, d) => setMcpTab(d.value as 'vscode' | 'cli')}
              className={styles.tabList}
            >
              <Tab value="vscode">VS Code</Tab>
              <Tab value="cli">CLI</Tab>
            </TabList>

            {mcpTab === 'vscode' && (
              <>
                <div className={styles.configHeader}>
                  <span className={styles.configHint}>Add to your VS Code settings.json under <code>mcp</code></span>
                  <Tooltip content={copiedField === 'mcp-config' ? 'Copied!' : 'Copy config'} relationship="label">
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={copiedField === 'mcp-config' ? <CheckmarkRegular /> : <CopyRegular />}
                      onClick={() => handleCopy(mcpConfig, 'mcp-config')}
                      aria-label="Copy config"
                      className={styles.copyBtn}
                    />
                  </Tooltip>
                </div>
                <pre className={styles.configBlock}>
                  <code>{mcpConfig}</code>
                </pre>
              </>
            )}

            {mcpTab === 'cli' && (
              <>
                <span className={styles.configHint}>Add this MCP server in GitHub Copilot CLI or Claude Code:</span>
                <div className={styles.commandRow}>
                  <code className={styles.command}>{mcpAddCommand}</code>
                  <Tooltip content={copiedField === 'mcp-cli' ? 'Copied!' : 'Copy'} relationship="label">
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={copiedField === 'mcp-cli' ? <CheckmarkRegular /> : <CopyRegular />}
                      onClick={() => handleCopy(mcpAddCommand, 'mcp-cli')}
                      aria-label="Copy CLI command"
                      className={styles.copyBtn}
                    />
                  </Tooltip>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Plugin marketplace bar */}
      <div className={styles.endpointBar}>
        <div className={styles.collapsed} onClick={() => setPluginExpanded(!pluginExpanded)}>
          <span className={styles.statusDot} />
          <span className={styles.serverLabel}>Plugin marketplace</span>
          <code className={styles.url}>{pluginEndpoint}</code>
          <Tooltip content={copiedField === 'plugin-url' ? 'Copied!' : 'Copy URL'} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={copiedField === 'plugin-url' ? <CheckmarkRegular /> : <CopyRegular />}
              onClick={(e) => { e.stopPropagation(); handleCopy(pluginEndpoint, 'plugin-url'); }}
              aria-label="Copy plugin marketplace URL"
              className={styles.copyBtn}
            />
          </Tooltip>
          {pluginDocsUrl && (
            <a
              href={pluginDocsUrl}
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
            icon={pluginExpanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
            className={styles.expandBtn}
            aria-label={pluginExpanded ? 'Collapse' : 'Expand'}
          />
        </div>

        {pluginExpanded && (
          <div className={styles.expandedContent}>
            <span className={styles.configHint}>Use these commands in GitHub Copilot CLI or Claude Code:</span>
            <div className={styles.commandList}>
              {pluginCommands.map((cmd, i) => (
                <div key={i} className={styles.commandItem}>
                  <span className={styles.commandLabel}>{cmd.label}</span>
                  <div className={styles.commandRow}>
                    <code className={styles.command}>{cmd.command}</code>
                    <Tooltip content={copiedField === `plugin-${i}` ? 'Copied!' : 'Copy'} relationship="label">
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={copiedField === `plugin-${i}` ? <CheckmarkRegular /> : <CopyRegular />}
                        onClick={() => handleCopy(cmd.command, `plugin-${i}`)}
                        aria-label={`Copy ${cmd.label} command`}
                        className={styles.copyBtn}
                      />
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EndpointBar);
