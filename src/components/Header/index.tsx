import React from 'react';
import { Button, Link, Text } from '@fluentui/react-components';
import { useRecoilState } from 'recoil';
import CloverLogo from '../logos/CloverLogo';

import config from '@/config';
import MsalAuthService from '@/services/MsalAuthService';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import css from './index.module.scss';

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useRecoilState(isAuthenticatedAtom);

  const signIn = async () => {
    await MsalAuthService.signIn();
    setIsAuthenticated(true);
  };

  const signOut = async () => {
    await MsalAuthService.signOut();
    setIsAuthenticated(false);
    // Refresh the URL to the original state
    window.location.href = window.location.origin;
  };

  return (
    <header className={css.header}>
      <div className={css.logo}>
        <CloverLogo />
        {!!config && (
          <Text size={400} weight="semibold">
            {config.title}
          </Text>
        )}
      </div>
      <div className={css.headerRight}>
        <div className={css.headerLinks}>
          <Link appearance="subtle" href="/">
            Home
          </Link>
          <Link
            appearance="subtle"
            href="https://learn.microsoft.com/en-us/azure/api-center/overview"
            target="_blank"
            rel="noopener noreferrer"
          >
            Help
          </Link>
        </div>
        <div className={css.signupButtonWrapper}>
          <Button
            appearance="primary"
            style={{
              backgroundColor: 'var(--blue-2)',
              minWidth: 'unset',
            }}
            onClick={() => {
              isAuthenticated ? signOut() : signIn();
            }}
          >
            {isAuthenticated ? 'Sign out' : 'Sign in'}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
