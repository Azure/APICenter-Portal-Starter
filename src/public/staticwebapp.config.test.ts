import { describe, expect, it } from 'vitest';
import config from './staticwebapp.config.json';

describe('staticwebapp.config.json', () => {
  it('declares a no-store cache-control route for the Entra redirect bridge with no COOP header', () => {
    const bridgeRoute = config.routes.find((route) => route.route === '/entraid-redirect.html');

    expect(bridgeRoute).toEqual({
      route: '/entraid-redirect.html',
      headers: {
        'cache-control': 'no-store',
      },
    });
    expect(bridgeRoute?.headers).not.toHaveProperty('cross-origin-opener-policy');
  });
});
