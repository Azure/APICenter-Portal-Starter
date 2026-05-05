import React, { useState } from 'react';
import { Button, Tooltip } from '@fluentui/react-components';
import { CopyRegular, CheckmarkRegular, ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons';
import styles from './InstallationBlock.module.scss';

interface InstallationBlockProps {
  assetType: 'mcp' | 'plugin' | 'skill';
  endpointUrl?: string;
  assetName?: string;
  dataApiHostName?: string;
}

interface Step {
  label: string;
  command: string;
}

export const InstallationBlock: React.FC<InstallationBlockProps> = ({
  assetType,
  endpointUrl,
  assetName: _assetName = '<asset-name>',
  dataApiHostName,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const serviceName = dataApiHostName?.split('.')[0] ?? '<your-service-name>';
  const marketplaceEndpoint = dataApiHostName
    ? `https://${dataApiHostName}/workspaces/default/plugins/marketplace.git`
    : '';

  let title = 'Install';
  let hint = '';
  let steps: Step[] = [];
  let docsUrl = '';

  if (assetType === 'mcp' && endpointUrl) {
    title = 'Connect to this MCP server';
    hint = 'Run these commands inside a copilot or claude session.';
    docsUrl = 'https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/how-to/github-copilot-cli';
    steps = [
      { label: 'Start interactive mode', command: 'copilot' },
      { label: 'Add this MCP server', command: `/mcp add ${endpointUrl}` },
      { label: 'Verify connection', command: '/mcp show' },
    ];
  } else if (assetType === 'plugin') {
    title = 'Plugin marketplace';
    hint = 'Discover and install plugins from your organization\'s marketplace.';
    docsUrl = 'https://learn.microsoft.com/en-us/azure/api-center/enable-api-center-plugin-marketplace';
    steps = [
      { label: 'Add the marketplace (one-time setup)', command: `/plugin marketplace add ${marketplaceEndpoint}` },
      { label: 'Browse plugins', command: `/plugin marketplace browse ${serviceName}` },
    ];
  } else if (assetType === 'skill') {
    title = 'Discover this skill';
    hint = 'Browse skills from your organization\'s plugin marketplace.';
    docsUrl = 'https://learn.microsoft.com/en-us/azure/api-center/enable-api-center-plugin-marketplace';
    steps = [
      { label: 'Add the marketplace (one-time setup)', command: `/plugin marketplace add ${marketplaceEndpoint}` },
      { label: 'Browse available skills', command: `/plugin marketplace browse ${serviceName}` },
    ];
  }

  if (steps.length === 0) return null;

  // The primary command to show inline in collapsed state
  const quickCopyCommand = steps.length > 1 ? steps[1].command : steps[0].command;

  return (
    <div className={styles.installationBlock}>
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <span className={styles.title}>{title}</span>
        <code className={styles.quickCommand}>{quickCopyCommand}</code>
        <Tooltip content={copiedField === 'quick' ? 'Copied!' : 'Copy'} relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={copiedField === 'quick' ? <CheckmarkRegular /> : <CopyRegular />}
            onClick={(e) => { e.stopPropagation(); handleCopy(quickCopyCommand, 'quick'); }}
            aria-label="Copy command"
            className={styles.copyBtn}
          />
        </Tooltip>
        <div className={styles.headerRight}>
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
            aria-label={expanded ? 'Collapse' : 'Expand'}
          />
        </div>
      </div>

      {expanded && (
        <div className={styles.content}>
          <span className={styles.hint}>
            {hint}
          </span>
          <div className={styles.steps}>
            {steps.map((step, i) => (
              <div key={i} className={styles.step}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <span className={styles.stepLabel}>{step.label}</span>
                <code className={styles.stepCommand}>{step.command}</code>
                <Tooltip content={copiedField === `s${i}` ? 'Copied!' : 'Copy'} relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={copiedField === `s${i}` ? <CheckmarkRegular /> : <CopyRegular />}
                    onClick={() => handleCopy(step.command, `s${i}`)}
                    aria-label={`Copy step ${i + 1}`}
                    className={styles.copyBtn}
                  />
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(InstallationBlock);
