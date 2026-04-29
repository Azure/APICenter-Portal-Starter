import React, { useCallback, useState } from 'react';
import { Button, Tab, TabList, Tooltip } from '@fluentui/react-components';
import { CopyRegular, CheckmarkRegular, ArrowDownloadRegular } from '@fluentui/react-icons';
import styles from './ConnectPanel.module.scss';

interface ConnectPanelProps {
  /** The raw endpoint URL */
  endpointUrl?: string;
  /** Asset name for display in snippets */
  assetName?: string;
  /** Handler for VS Code install deeplink */
  onVsCodeInstall?: () => void;
  /** Whether VS Code install is available */
  hasVsCodeInstall?: boolean;
}

type ClientTab = 'cli' | 'vscode';

const EXTENSION_URL = 'https://marketplace.visualstudio.com/items?itemName=apidev.azure-api-center';

export const ConnectPanel: React.FC<ConnectPanelProps> = ({
  endpointUrl,
  assetName,
  onVsCodeInstall,
  hasVsCodeInstall,
}) => {
  const [selectedTab, setSelectedTab] = useState<ClientTab>('cli');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (!endpointUrl && !hasVsCodeInstall) return null;

  const availableTabs: { value: ClientTab; label: string }[] = [];
  if (endpointUrl) availableTabs.push({ value: 'cli', label: 'CLI' });
  if (hasVsCodeInstall) availableTabs.push({ value: 'vscode', label: 'VS Code' });

  return (
    <div className={styles.connectPanel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Install</h3>
        {availableTabs.length > 1 && (
          <TabList
            className={styles.tabList}
            size="small"
            selectedValue={selectedTab}
            onTabSelect={(_, d) => setSelectedTab(d.value as ClientTab)}
          >
            {availableTabs.map(tab => (
              <Tab key={tab.value} value={tab.value}>{tab.label}</Tab>
            ))}
          </TabList>
        )}
      </div>

      <div className={styles.tabContent}>
        {selectedTab === 'cli' && endpointUrl && (
          <>
            <span className={styles.hint}>
              Use this endpoint in any MCP-compatible client or CLI tool.
            </span>
            <div className={styles.codeBlock}>
              <code className={styles.code} title={endpointUrl}>{endpointUrl}</code>
              <Tooltip
                content={copied ? 'Copied!' : 'Copy'}
                relationship="label"
                positioning="above"
              >
                <Button
                  className={styles.copyBtn}
                  appearance="subtle"
                  size="small"
                  icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
                  onClick={() => handleCopy(endpointUrl)}
                  aria-label="Copy endpoint"
                />
              </Tooltip>
            </div>
          </>
        )}

        {selectedTab === 'vscode' && hasVsCodeInstall && (
          <>
            <Button
              className={styles.installBtn}
              appearance="primary"
              size="medium"
              icon={<ArrowDownloadRegular />}
              onClick={onVsCodeInstall}
            >
              Install in VS Code
            </Button>
            <span className={styles.hint}>
              Requires the{' '}
              <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer">
                API Center extension
              </a>
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(ConnectPanel);
