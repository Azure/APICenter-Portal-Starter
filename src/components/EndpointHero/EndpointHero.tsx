import React, { useState } from 'react';
import { Button, Tooltip } from '@fluentui/react-components';
import { CopyRegular, CheckmarkRegular } from '@fluentui/react-icons';
import styles from './EndpointHero.module.scss';

interface EndpointHeroProps {
  mcpEndpoint?: string;
  marketplaceEndpoint?: string;
}

export const EndpointHero: React.FC<EndpointHeroProps> = ({
  mcpEndpoint = 'https://your-apic-instance.azure-apicenter.ms/mcp',
  marketplaceEndpoint = 'https://your-apic-instance.azure-apicenter.ms/plugins.git',
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className={styles.endpointHero}>
      <div className={styles.field}>
        <span className={styles.label}>MCP endpoint</span>
        <div className={styles.valueRow}>
          <code className={styles.value}>{mcpEndpoint}</code>
          <Tooltip content={copiedField === 'mcp' ? 'Copied!' : 'Copy'} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={copiedField === 'mcp' ? <CheckmarkRegular /> : <CopyRegular />}
              onClick={() => handleCopy(mcpEndpoint, 'mcp')}
              aria-label="Copy MCP endpoint"
              className={styles.copyBtn}
            />
          </Tooltip>
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.field}>
        <span className={styles.label}>Plugin marketplace</span>
        <div className={styles.valueRow}>
          <code className={styles.value}>{marketplaceEndpoint}</code>
          <Tooltip content={copiedField === 'marketplace' ? 'Copied!' : 'Copy'} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={copiedField === 'marketplace' ? <CheckmarkRegular /> : <CopyRegular />}
              onClick={() => handleCopy(marketplaceEndpoint, 'marketplace')}
              aria-label="Copy marketplace endpoint"
              className={styles.copyBtn}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EndpointHero);
