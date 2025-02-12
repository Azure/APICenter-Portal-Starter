import React, { useCallback } from 'react';
import { Button } from '@fluentui/react-components';
import { useRecoilState } from 'recoil';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import useAuthService from '@/hooks/useAuthService';
import styles from './AuthBtn.module.scss';

export const AuthBtn: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useRecoilState(isAuthenticatedAtom);
  const AuthService = useAuthService();

  const handleClick = useCallback(async () => {
    if (isAuthenticated) {
      await AuthService.signOut();
      setIsAuthenticated(false);
      // Refresh the URL to the original state
      window.location.href = window.location.origin;
      return;
    }

    await AuthService.signIn();
    setIsAuthenticated(true);
  }, [AuthService, isAuthenticated, setIsAuthenticated]);

  return (
    <Button className={styles.authBtn} appearance="primary" onClick={handleClick}>
      {isAuthenticated ? 'Sign out' : 'Sign in'}
    </Button>
  );
};

export default React.memo(AuthBtn);
