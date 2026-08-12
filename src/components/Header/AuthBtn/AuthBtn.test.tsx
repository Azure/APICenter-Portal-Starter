import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appServicesAtom } from '@/atoms/appServicesAtom';
import { configAtom } from '@/atoms/configAtom';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import AuthBtn from './AuthBtn';

interface RenderAuthButtonOptions {
  isAuthenticated?: boolean;
  signIn?: () => Promise<void>;
  signOut?: () => Promise<void>;
}

function renderAuthButton({
  isAuthenticated = false,
  signIn = () => Promise.resolve(),
  signOut = () => Promise.resolve(),
}: RenderAuthButtonOptions = {}) {
  return render(
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
        set(isAuthenticatedAtom, isAuthenticated);
        set(appServicesAtom, {
          AuthService: {
            isAuthenticated: () => Promise.resolve(false),
            getAccessToken: () => Promise.resolve(''),
            signIn,
            signOut,
          },
        });
      }}
    >
      <AuthBtn />
    </RecoilRoot>
  );
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

  it('keeps the portal usable when popup sign-in fails', async () => {
    const signIn = vi.fn(() => Promise.reject(new Error('popup_window_error')));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = renderAuthButton({ signIn });
    const view = within(container);

    fireEvent.click(view.getByRole('button', { name: 'Sign in' }));

    expect((await view.findByRole('alert')).textContent).toContain('Sign-in was not completed. Please try again.');
    expect(view.getByRole('button', { name: 'Sign in' })).toHaveProperty('disabled', false);
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
    const { container } = renderAuthButton({ signIn });
    const view = within(container);

    const button = view.getByRole('button', { name: 'Sign in' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(view.getByRole('button', { name: 'Signing in...' })).toHaveProperty('disabled', true);
    resolveSignIn();
    await waitFor(() => expect(view.getByRole('button', { name: 'Sign out' })).toHaveProperty('disabled', false));
  });

  it('keeps sign-out failures on the sign-out state without falling through to sign-in', async () => {
    const signIn = vi.fn(() => Promise.resolve());
    const signOut = vi.fn(() => Promise.reject({ errorCode: 'popup_window_error' }));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = renderAuthButton({
      isAuthenticated: true,
      signIn,
      signOut,
    });
    const view = within(container);

    fireEvent.click(view.getByRole('button', { name: 'Sign out' }));

    expect((await view.findByRole('alert')).textContent).toContain('Sign-out was not completed. Please try again.');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signIn).not.toHaveBeenCalled();
    expect(view.getByRole('button', { name: 'Sign out' })).toHaveProperty('disabled', false);
    expect(consoleError).toHaveBeenCalledWith('Authentication interaction failed (popup_window_error).');
  });
});
