import * as uuid from 'uuid';

/**
 * `localStorage` key holding the OAuth `state` values this portal has issued, mapped to the
 * timestamp at which each stops being claimable.
 *
 * The inline callback bridge in `index.html` reads this key directly. It runs before the bundle
 * loads and therefore cannot import from here, so the literal is duplicated there - keep the two
 * in sync.
 */
export const OAUTH_PENDING_STATES_KEY = 'apic.oauth.pendingStates';

/**
 * How long an issued state stays claimable. Comfortably longer than the popup timeout in
 * `OAuthService`, so a slow but legitimate sign-in is never rejected.
 */
const STATE_TTL_MS = 10 * 60 * 1000;

type PendingStates = Record<string, number>;

function readPendingStates(): PendingStates {
  try {
    const raw = localStorage.getItem(OAUTH_PENDING_STATES_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    const now = Date.now();

    // Drop expired entries so an abandoned popup cannot leave the key growing forever.
    return Object.entries(parsed as PendingStates).reduce<PendingStates>((pending, [state, expiresAt]) => {
      if (typeof expiresAt === 'number' && expiresAt > now) {
        pending[state] = expiresAt;
      }

      return pending;
    }, {});
  } catch {
    // Storage may be unavailable or hold something we did not write. Treat it as empty.
    return {};
  }
}

function writePendingStates(pending: PendingStates): void {
  try {
    localStorage.setItem(OAUTH_PENDING_STATES_KEY, JSON.stringify(pending));
  } catch {
    // Losing the registry only means the bridge will not claim this response - never throw here.
  }
}

/**
 * Creates an OAuth `state` and records it as issued by this portal, so the callback bridge can
 * tell our authorization responses apart from those of other libraries sharing this origin.
 *
 * @returns The newly issued `state` value, to be sent on the authorization request.
 * @example
 * const state = issueOAuthState();
 */
export function issueOAuthState(): string {
  const state = uuid.v4();
  const pending = readPendingStates();

  pending[state] = Date.now() + STATE_TTL_MS;
  writePendingStates(pending);

  return state;
}

/**
 * Forgets a previously issued `state` once its authentication attempt has settled.
 *
 * @param state - The value returned by {@link issueOAuthState}.
 */
export function releaseOAuthState(state: string): void {
  const pending = readPendingStates();

  delete pending[state];
  writePendingStates(pending);
}

/**
 * Reports whether a `state` echoed back by an authorization server was issued by this portal and
 * has not expired.
 *
 * @param state - The `state` value read from the authorization response.
 * @returns `true` when the response belongs to an authentication attempt this portal started.
 */
export function isPortalIssuedOAuthState(state: string): boolean {
  return typeof readPendingStates()[state] === 'number';
}
