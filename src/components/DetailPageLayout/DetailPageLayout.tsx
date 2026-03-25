import React from 'react';
import { Button, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import styles from './DetailPageLayout.module.scss';

interface DetailPageLayoutProps {
  title?: string;
  summary?: string;
  metadata?: React.ReactNode;
  headerActions?: React.ReactNode;
  selector?: React.ReactNode;
  tabs?: React.ReactNode;
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  error?: string;
  onRetry?: () => void;
}

export const DetailPageLayout: React.FC<DetailPageLayoutProps> = ({
  title,
  summary,
  metadata,
  headerActions,
  selector,
  tabs,
  sidebar,
  children,
  isLoading,
  emptyMessage,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className={styles.detailPage}>
        <Spinner className={styles.spinner} size="large" label="Loading..." labelPosition="below" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.detailPage}>
        <section className={styles.errorState}>
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
          {onRetry && (
            <Button appearance="primary" onClick={onRetry}>
              Try again
            </Button>
          )}
        </section>
      </div>
    );
  }

  if (emptyMessage) {
    return (
      <div className={styles.detailPage}>
        <section>
          <EmptyStateMessage>{emptyMessage}</EmptyStateMessage>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            {title && <h1>{title}</h1>}
            {summary && <p className={styles.summary}>{summary}</p>}
            {metadata && <div className={styles.metadata}>{metadata}</div>}
          </div>
          {headerActions && <div className={styles.headerActions}>{headerActions}</div>}
        </div>
      </section>

      {selector && <section className={styles.selector}>{selector}</section>}

      {tabs && <section className={styles.tabBar}>{tabs}</section>}

      <section>
        <div className={styles.content}>
          <div className={styles.main}>{children}</div>
          {sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}
        </div>
      </section>
    </div>
  );
};

export default React.memo(DetailPageLayout);
