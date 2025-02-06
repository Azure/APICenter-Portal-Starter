import React from 'react';
import { Link } from '@fluentui/react-components';
import styles from './Footer.module.scss';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <span>&copy; Copyright 2024</span>
      <Link appearance="subtle" href="#">
        Terms
      </Link>
      <Link appearance="subtle" href="#">
        Privacy
      </Link>
    </footer>
  );
};

export default React.memo(Footer);
