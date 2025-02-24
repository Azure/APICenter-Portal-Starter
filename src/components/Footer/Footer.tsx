import React from 'react';
import { Link } from '@fluentui/react-components';
import styles from './Footer.module.scss';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <span className={styles.poweredBy}>
        Powered by
        <Link appearance="subtle" href="https://learn.microsoft.com/azure/api-center/overview" target="_blank">
          Azure API Center
        </Link>
      </span>
    </footer>
  );
};

export default React.memo(Footer);
