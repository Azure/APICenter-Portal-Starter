import { describe, it, expect, beforeEach, vi } from 'vitest';
// The bridge is inline in `index.html` so it runs before the bundle; pull in the real markup rather
// than a copy, so this test cannot drift from what ships.
import indexHtml from '../../index.html?raw';
import { OAUTH_PENDING_STATES_KEY, issueOAuthState, releaseOAuthState, isPortalIssuedOAuthState } from './oauthState';

/**
 * Extracts the inline OAuth callback bridge from `index.html` - it is one half of the contract with
 * `OAuthService` and is otherwise never exercised by tests.
 */
function loadBridge(): string {
  const script = indexHtml.match(/<script type="text\/javascript">([\s\S]*?)<\/script>/);

  if (!script) {
    throw new Error('Could not find the inline OAuth callback bridge in index.html');
  }

  return script[1];
}

interface BridgeResult {
  postMessage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

function runBridge(hash: string, search = ''): BridgeResult {
  const postMessage = vi.fn();
  const close = vi.fn();

  const fakeWindow = {
    opener: { postMessage },
    location: { hash, search, origin: 'https://portal.example.com' },
    localStorage,
    close,
  };

  new Function('window', loadBridge())(fakeWindow);

  return { postMessage, close };
}

describe('oauthState', () => {
  beforeEach(() => localStorage.clear());

  it('recognises a state it issued', () => {
    const state = issueOAuthState();

    expect(isPortalIssuedOAuthState(state)).toBe(true);
  });

  it('does not recognise a foreign state', () => {
    expect(isPortalIssuedOAuthState('some-other-library-state')).toBe(false);
  });

  it('forgets a released state', () => {
    const state = issueOAuthState();

    releaseOAuthState(state);

    expect(isPortalIssuedOAuthState(state)).toBe(false);
  });

  it('discards expired states instead of accumulating them', () => {
    const state = issueOAuthState();

    localStorage.setItem(OAUTH_PENDING_STATES_KEY, JSON.stringify({ [state]: Date.now() - 1 }));

    expect(isPortalIssuedOAuthState(state)).toBe(false);

    issueOAuthState();

    expect(Object.keys(JSON.parse(localStorage.getItem(OAUTH_PENDING_STATES_KEY)!))).not.toContain(state);
  });

  it('survives a corrupt registry', () => {
    localStorage.setItem(OAUTH_PENDING_STATES_KEY, 'not json');

    expect(isPortalIssuedOAuthState('anything')).toBe(false);
    expect(() => issueOAuthState()).not.toThrow();
  });
});

describe('index.html OAuth callback bridge', () => {
  beforeEach(() => localStorage.clear());

  it('claims a response for a state this portal issued', () => {
    const state = issueOAuthState();

    const { postMessage, close } = runBridge(`#code=abc&state=${state}`);

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage.mock.calls[0][0]).toMatchObject({ code: 'abc', state });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('ignores the MSAL sign-in popup instead of closing it', () => {
    // MSAL redirects back to this same page with its own code and state in the fragment. Claiming
    // it closed the popup, so MSAL saw `popupWindow.closed` and rejected the sign-in.
    const { postMessage, close } = runBridge('#code=0.AXkAmsal-code&client_info=eyJ1aWQiOiJ4In0&state=msal-owned');

    expect(postMessage).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it('ignores an error response belonging to another library', () => {
    const { close } = runBridge('#error=access_denied&state=msal-owned');

    expect(close).not.toHaveBeenCalled();
  });

  it('still claims a response from a provider that drops state', () => {
    const { postMessage, close } = runBridge('', '?code=abc');

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('claims implicit tokens for an issued state and forwards the raw fragment', () => {
    const state = issueOAuthState();
    const hash = `#access_token=token123&token_type=Bearer&state=${state}`;

    const { postMessage, close } = runBridge(hash);

    expect(postMessage.mock.calls[0][0]).toMatchObject({ uri: hash });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is no opener', () => {
    const close = vi.fn();
    const fakeWindow = {
      opener: null,
      location: { hash: '#code=abc', search: '', origin: 'https://portal.example.com' },
      localStorage,
      close,
    };

    new Function('window', loadBridge())(fakeWindow);

    expect(close).not.toHaveBeenCalled();
  });
});
