import React from 'react';
import styles from './TestConsoleError.module.scss';

interface Props {
  children: React.ReactNode;
}

export const TestConsoleError: React.FC<Props> = ({ children }) => {
  return <div className={styles.testConsoleError}>{children}</div>;
};

export default React.memo(TestConsoleError);
