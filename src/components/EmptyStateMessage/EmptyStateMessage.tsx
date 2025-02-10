import React from 'react';
import NoResultsSvg from '@/assets/noResults.svg';
import styles from './EmptyStateMessage.module.scss';

interface Props {
  children: React.ReactNode;
}

export const EmptyStateMessage: React.FC<Props> = ({ children }) => {
  return (
    <div className={styles.emptyStateMessage}>
      <img src={NoResultsSvg} alt="No results" />
      <div>{children}</div>
    </div>
  );
};

export default React.memo(EmptyStateMessage);
