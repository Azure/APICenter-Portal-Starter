import React, { useCallback, useState } from 'react';
import { Button, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { useRecoilState, useRecoilValue } from 'recoil';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { isAnonymousAccessEnabledAtom } from '@/atoms/isAnonymousAccessEnabledAtom';
import { useAuthService } from '@/hooks/useAuthService';
import styles from './AuthBtn.module.scss';

function getAuthenticationErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'errorCode' in error && typeof error.errorCode === 'string') {
    return error.errorCode;
  }

  return 'unknown_error';
}

export const AuthBtn: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useRecoilState(isAuthenticatedAtom);
  const isAnonymousAccessEnabled = useRecoilValue(isAnonymousAccessEnabledAtom);
  const AuthService = useAuthService();
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const handleClick = useCallback(async () => {
    if (isPending) {
      return;
    }

    const nextErrorMessage = isAuthenticated
      ? 'Sign-out was not completed. Please try again.'
      : 'Sign-in was not completed. Please try again.';

    setError(undefined);
    setIsPending(true);

    if (isAuthenticated) {
      try {
        await AuthService.signOut();
        setIsAuthenticated(false);
        // Refresh the URL to the original state
        window.location.href = window.location.origin;
        return;
      } catch (authError) {
        console.error(`Authentication interaction failed (${getAuthenticationErrorCode(authError)}).`);
        setError(nextErrorMessage);
      } finally {
        setIsPending(false);
      }
    }

    try {
      await AuthService.signIn();
      setIsAuthenticated(true);
    } catch (authError) {
      console.error(`Authentication interaction failed (${getAuthenticationErrorCode(authError)}).`);
      setError(nextErrorMessage);
    } finally {
      setIsPending(false);
    }
  }, [AuthService, isAuthenticated, isPending, setIsAuthenticated]);

  // Hide sign in button when anonymous access is enabled
  if (isAnonymousAccessEnabled) {
    return null;
  }

  return (
    <div className={styles.authControl}>
      <Button className={styles.authBtn} appearance="primary" disabled={isPending} onClick={handleClick}>
        {isPending ? (isAuthenticated ? 'Signing out...' : 'Signing in...') : isAuthenticated ? 'Sign out' : 'Sign in'}
      </Button>

      {error && (
        <MessageBar className={styles.authError} intent="error" role="alert">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
};

export default React.memo(AuthBtn);
