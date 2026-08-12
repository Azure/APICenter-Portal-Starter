import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appServicesAtom } from '@/atoms/appServicesAtom';
import { configAtom } from '@/atoms/configAtom';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import AuthBtn from './AuthBtn';

let unmountAuthButton: (() => void) | undefined;

function renderAuthButton(signIn: () => Promise<void>) {
  const rendered = render(
    <RecoilRoot
      initializeState={({ set }) => {
        set(configAtom, {
          title: 'Portal',
          dataApiHostName: 'api.example.test',
          scopingFilter: '',
          capabilities: [],
          authentication: {
            clientId: 'client',
            tenantId: 'tenant',
            authority: 'https://login.microsoftonline.com/',
            azureAdInstance: '',
            scopes: ['scope'],
          },
        });
        set(isAuthenticatedAtom, false);
        set(appServicesAtom, {
          AuthService: {
            isAuthenticated: () => Promise.resolve(false),
            getAccessToken: () => Promise.resolve(''),
            signIn,
            signOut: () => Promise.resolve(),
          },
        });
      }}
    >
      <AuthBtn />
    </RecoilRoot>
  );

  unmountAuthButton = rendered.unmount;
  return rendered;
}

describe('AuthBtn', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}

        unobserve(): void {}

        disconnect(): void {}
      }
    );
  });

  afterEach(() => {
    unmountAuthButton?.();
    unmountAuthButton = undefined;
    vi.unstubAllGlobals();
  });

  it('keeps the portal usable when popup sign-in fails', async () => {
    const signIn = vi.fn(() => Promise.reject(new Error('popup_window_error')));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { getByRole, findByRole } = renderAuthButton(signIn);

    fireEvent.click(getByRole('button', { name: 'Sign in' }));

    expect((await findByRole('alert')).textContent).toContain('Sign-in was not completed. Please try again.');
    expect(getByRole('button', { name: 'Sign in' })).toHaveProperty('disabled', false);
    expect(consoleError).toHaveBeenCalledWith('Authentication interaction failed (unknown_error).');
  });

  it('prevents concurrent popup interactions', async () => {
    let resolveSignIn: () => void = () => undefined;
    const signIn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSignIn = resolve;
        })
    );
    const { getByRole } = renderAuthButton(signIn);

    const button = getByRole('button', { name: 'Sign in' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(getByRole('button', { name: 'Signing in...' })).toHaveProperty('disabled', true);
    resolveSignIn();
    await waitFor(() => expect(getByRole('button', { name: 'Sign out' })).toHaveProperty('disabled', false));
  });
});
