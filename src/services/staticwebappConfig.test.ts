import { describe, expect, it } from 'vitest';
import config from '@/public/staticwebapp.config.json';

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

  it('rewrites unmatched deep links to /index.html while excluding assets, config, and the redirect bridge', () => {
    expect(config.navigationFallback).toEqual({
      rewrite: '/index.html',
      exclude: ['/assets/*', '/config.json', '/entraid-redirect.html'],
    });
  });
});
