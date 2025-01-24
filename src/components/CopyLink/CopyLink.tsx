import React, { useCallback, useState } from 'react';
import { Tooltip, Link } from '@fluentui/react-components';
import { CheckmarkCircle12Regular, CopyRegular } from '@fluentui/react-icons';
import styles from './CopyLink.module.scss';

interface Props {
  className?: string;
  url: string;
  children: React.ReactNode;
}

export const CopyLink: React.FC<Props> = ({ className, children, url }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleClick = useCallback(() => {
    void navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [url]);

  return (
    <Tooltip
      content={
        <div className={styles.tooltip}>
          <CheckmarkCircle12Regular />
          Copied to clipboard
        </div>
      }
      relationship="description"
      visible={isCopied}
      positioning="below"
    >
      <Link href="#" className={className} onClick={handleClick}>
        {children} <CopyRegular />
      </Link>
    </Tooltip>
  );
};

export default React.memo(CopyLink);
