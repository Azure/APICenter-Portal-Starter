import React, { useCallback } from 'react';
import { Button } from '@fluentui/react-components';
import { useRecoilState } from 'recoil';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import MsalAuthService from '@/services/MsalAuthService';
import styles from './AuthBtn.module.scss';

export const AuthBtn: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useRecoilState(isAuthenticatedAtom);

  const handleClick = useCallback(async () => {
    setIsAuthenticated((prev) => !prev);
    if (isAuthenticated) {
      await MsalAuthService.signOut();
      // Refresh the URL to the original state
      window.location.href = window.location.origin;
      return;
    }

    await MsalAuthService.signIn();
  }, [isAuthenticated, setIsAuthenticated]);

  return (
    <Button className={styles.authBtn} appearance="primary" onClick={handleClick}>
      {isAuthenticated ? 'Sign out' : 'Sign in'}
    </Button>
  );
};

export default React.memo(AuthBtn);
