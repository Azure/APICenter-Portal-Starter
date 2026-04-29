import React, { useCallback, useState } from 'react';
import { Button, Tooltip } from '@fluentui/react-components';
import { CopyRegular, CheckmarkRegular } from '@fluentui/react-icons';
import styles from './CopyableEndpoint.module.scss';

interface CopyableEndpointProps {
  label?: string;
  value: string;
}

export const CopyableEndpoint: React.FC<CopyableEndpointProps> = ({ label = 'Endpoint', value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <div className={styles.copyableEndpoint}>
      <span className={styles.label}>{label}</span>
      <div className={styles.codeBlock}>
        <code className={styles.endpoint} title={value}>{value}</code>
        <Tooltip
          content={copied ? 'Copied!' : 'Copy to clipboard'}
          relationship="label"
          positioning="above"
        >
          <Button
            className={styles.copyButton}
            appearance="subtle"
            size="small"
            icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
            onClick={handleCopy}
            aria-label="Copy endpoint"
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default React.memo(CopyableEndpoint);
