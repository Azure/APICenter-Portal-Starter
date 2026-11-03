import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpService } from '@/services/HttpService';
import { ApiService } from './ApiService';

vi.mock('@/services/HttpService', () => ({
  HttpService: { get: vi.fn() },
}));

describe('ApiService.getServer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserves modern enveloped server details', async () => {
    const server = {
      name: 'modern',
      packages: [{ identifier: 'pkg', registryBaseUrl: 'https://private.example/npm' }],
      remotes: [{ type: 'streamable-http', url: 'https://example.com/mcp' }],
      repository: { url: 'https://example.com/source' },
    };
    const metadata = { 'io.modelcontextprotocol.registry/official': { status: 'active', isLatest: true } };
    vi.mocked(HttpService.get).mockResolvedValue({ server, _meta: metadata });

    expect(await ApiService.getServer('modern')).toMatchObject({
      ...server,
      remotes: [{ transport_type: 'streamable-http', url: 'https://example.com/mcp' }],
      registryMetadata: metadata,
    });
    expect(HttpService.get).toHaveBeenCalledWith('/v0/servers/modern');
  });

  it('preserves legacy direct server details and snake_case package fields', async () => {
    const server = {
      name: 'legacy',
      packages: [
        {
          name: 'pkg',
          registry_base_url: 'https://private.example/npm',
          registry_type: 'npm',
          runtime_hint: 'npx',
          runtime_arguments: [{ value: '--yes' }],
          package_arguments: [{ value: '--verbose' }],
          environment_variables: [{ name: 'DEBUG', value: 'true' }],
          file_sha256: 'abc123',
        },
      ],
    };
    vi.mocked(HttpService.get).mockResolvedValue(server);

    expect(await ApiService.getServer('legacy')).toMatchObject({
      name: 'legacy',
      packages: [
        {
          identifier: 'pkg',
          registryBaseUrl: 'https://private.example/npm',
          registryType: 'npm',
          runtimeHint: 'npx',
          runtimeArguments: [{ value: '--yes' }],
          packageArguments: [{ value: '--verbose' }],
          environmentVariables: [{ name: 'DEBUG', value: 'true' }],
          fileSha256: 'abc123',
        },
      ],
    });
  });

  it('preserves an unavailable response', async () => {
    vi.mocked(HttpService.get).mockResolvedValue(undefined);
    expect(await ApiService.getServer('missing')).toBeUndefined();
  });
});
