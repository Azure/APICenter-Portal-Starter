import { describe, expect, it } from 'vitest';
import { getSkillInstallParams, getSkillSourceUrl } from './skillInstall';

const authentication = { clientId: 'client-id', tenantId: 'tenant-id', scopes: [], authority: '', azureAdInstance: '' };

describe('getSkillSourceUrl', () => {
  it('returns undefined when neither customProperties.sourceUrl nor source.url is usable', () => {
    expect(getSkillSourceUrl(undefined)).toBeUndefined();
    expect(getSkillSourceUrl({ customProperties: { sourceUrl: null } })).toBeUndefined();
    expect(getSkillSourceUrl({ customProperties: { sourceUrl: '   ' }, source: { type: 'git' } })).toBeUndefined();
  });

  it('prefers a trimmed customProperties.sourceUrl over the resolved source URL', () => {
    expect(
      getSkillSourceUrl({
        customProperties: { sourceUrl: '  https://github.com/owner/repo/tree/main/override  ' },
        source: { url: 'https://github.com/owner/repo/tree/main/skills/my-skill' },
      })
    ).toBe('https://github.com/owner/repo/tree/main/override');
    expect(getSkillSourceUrl({ source: { url: 'https://github.com/owner/repo/tree/main/skills/my-skill' } })).toBe(
      'https://github.com/owner/repo/tree/main/skills/my-skill'
    );
  });
});

describe('getSkillInstallParams', () => {
  it('returns undefined without a source URL or portal authentication', () => {
    expect(
      getSkillInstallParams({ name: 'my-skill' }, { dataApiHostName: 'example.data.eastus.azure-apicenter.ms' })
    ).toBeUndefined();
  });

  it('includes API Center coordinates with a bare host name when the portal uses Entra ID authentication', () => {
    expect(
      getSkillInstallParams(
        { name: 'my-skill' },
        { dataApiHostName: 'https://example.data.eastus.azure-apicenter.ms/', authentication },
        'v1'
      )
    ).toEqual({
      name: 'my-skill',
      sourceUrl: undefined,
      apiCenter: {
        dataApiHost: 'example.data.eastus.azure-apicenter.ms',
        clientId: 'client-id',
        tenantId: 'tenant-id',
        workspace: 'default',
        version: 'v1',
      },
    });
  });
});
