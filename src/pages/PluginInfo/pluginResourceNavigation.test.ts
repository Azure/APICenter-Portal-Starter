import { describe, expect, it } from 'vitest';
import { getPluginResourceNavigation } from './pluginResourceNavigation';

describe('getPluginResourceNavigation', () => {
  it.each([
    ['agent', '/agents/example'],
    ['skill', '/skills/example'],
    ['MCP', '/servers/example'],
    ['model', '/models/example/detail'],
    ['languageModel', '/models/example/detail'],
  ])('routes %s resources to their detail page', (kind, expectedUrl) => {
    expect(getPluginResourceNavigation('example', kind)).toEqual({ to: expectedUrl });
  });

  it('preserves the API drawer fallback', () => {
    window.history.replaceState({}, '', '/?kind=plugin');

    expect(getPluginResourceNavigation('example', 'rest')).toEqual({
      to: '/?kind=plugin',
      state: { drawer: { kind: 'api', name: 'example' } },
    });
  });
});
