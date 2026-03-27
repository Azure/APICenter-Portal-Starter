import React, { useCallback, useState } from 'react';
import { Button, Tooltip } from '@fluentui/react-components';
import { ShareRegular, CheckmarkRegular } from '@fluentui/react-icons';
import styles from './HeaderActions.module.scss';

const EXTENSION_URL = 'https://marketplace.visualstudio.com/items?itemName=apidev.azure-api-center';

interface HeaderActionsProps {
  showExtensionHint?: boolean;
  children?: React.ReactNode;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({ showExtensionHint, children }) => {
  return (
    <div className={styles.headerActions}>
      <div className={styles.buttons}>{children}</div>
      {showExtensionHint && (
        <span className={styles.hint}>
          Requires{' '}
          <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer">
            API Center extension
          </a>
        </span>
      )}
    </div>
  );
};

export const ShareButton: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <Tooltip
      content="Copied to clipboard!"
      relationship="description"
      visible={copied}
      positioning="below"
    >
      <Button
        appearance="outline"
        icon={copied ? <CheckmarkRegular /> : <ShareRegular />}
        onClick={handleShare}
      >
        Share
      </Button>
    </Tooltip>
  );
};
