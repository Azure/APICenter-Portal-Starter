import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Server } from '@/types/server';
import { McpServerMetadata } from './McpServerMetadata';

vi.mock('@/hooks/useMetadataSchemas', () => ({
  useMetadataSchemas: () => ({ data: undefined }),
}));

afterEach(cleanup);

describe('McpServerMetadata', () => {
  it('prefers modern fields when legacy aliases are also present', () => {
    render(
      <McpServerMetadata
        server={{
          name: 'example',
          websiteUrl: 'https://modern.example',
          website_url: 'https://legacy.example',
        }}
      />
    );
    expect(screen.getByText('https://modern.example')).toBeTruthy();
    expect(screen.queryByText('https://legacy.example')).toBeNull();
  });

  it('shows registry URLs and other backend package and server fields for every package', () => {
    const server: Server = {
      name: 'example/server',
      version: '2.0',
      websiteUrl: 'https://example.com',
      repository: { url: 'https://github.com/example/server', source: 'github', subfolder: 'src' },
      icons: [{ src: 'https://example.com/icon.png', mimeType: 'image/png', sizes: ['48x48'], theme: 'dark' }],
      packages: [
        {
          identifier: '@example/server',
          registryType: 'npm',
          registryBaseUrl: 'https://private.example/npm/',
          fileSha256: 'abc123',
          version: '2.0',
          runtimeHint: 'npx',
          runtimeArguments: [{ name: '--yes', value: 'true' }],
          packageArguments: [{ name: '--port', value: '8080', isRequired: false }],
          environmentVariables: [{ name: 'LOG_LEVEL', value: 'debug', default: 'info', choices: ['debug', 'info'] }],
          transport: { type: 'stdio' },
        },
        {
          identifier: 'other-server',
          registryType: 'pypi',
          registryBaseUrl: 'https://private.example/pypi/',
          version: '1.0',
          runtimeHint: 'uvx',
          runtimeArguments: [],
        },
      ],
      remotes: [
        {
          transport_type: 'sse',
          type: 'sse',
          url: 'https://example.com/mcp',
          headers: [{ name: 'Accept', value: 'text/event-stream' }],
        },
      ],
    };

    render(<McpServerMetadata server={server} />);

    const first = within(screen.getByRole('region', { name: 'Package 1' }));
    expect(first.getByText('Registry base URL:')).toBeTruthy();
    expect(first.getByText('https://private.example/npm/')).toBeTruthy();
    for (const text of [
      'SHA-256:',
      'abc123',
      'Runtime arguments:',
      'Package arguments:',
      '--port',
      '8080',
      'Environment variables:',
      'LOG_LEVEL',
      'debug',
      'Transport:',
    ]) {
      expect(first.getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(first.getByText('No')).toBeTruthy();
    expect(
      within(screen.getByRole('region', { name: 'Package 2' })).getByText('https://private.example/pypi/')
    ).toBeTruthy();
    for (const text of [
      'https://example.com',
      'https://github.com/example/server',
      'src',
      'https://example.com/icon.png',
      '48x48',
      'https://example.com/mcp',
      'text/event-stream',
    ]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    const remote = within(screen.getByRole('region', { name: 'Remote connection 1' }));
    expect(remote.getByText('Transport type:')).toBeTruthy();
    expect(remote.queryByText('Type:')).toBeNull();
  });

  it('shows legacy snake_case fields and masks secret values and defaults, including nested variables', () => {
    render(
      <McpServerMetadata
        server={{
          name: 'legacy',
          website_url: 'https://legacy.example',
          packages: [
            {
              identifier: 'legacy-package',
              registryType: 'npm',
              version: '1.0',
              runtimeHint: 'npx',
              runtimeArguments: [],
              registry_base_url: 'https://legacy.example/registry',
              file_sha256: 'legacy-hash',
              environment_variables: [
                {
                  name: 'TOKEN',
                  is_secret: true,
                  value: 'secret-value',
                  default: 'secret-default',
                  variables: {
                    token: {
                      isSecret: false,
                      value: 'nested-secret',
                      default: 'nested-default',
                    },
                  },
                },
              ],
            },
          ],
          remotes: [
            {
              transport_type: 'http',
              url: 'https://legacy.example/mcp',
              headers: [{ name: 'Authorization', isSecret: true, value: 'Bearer hidden' }],
            },
          ],
        }}
      />
    );

    expect(screen.getByText('https://legacy.example/registry')).toBeTruthy();
    expect(screen.getByText('legacy-hash')).toBeTruthy();
    expect(screen.getByText('TOKEN')).toBeTruthy();
    expect(screen.getAllByText('[redacted]')).toHaveLength(5);
    for (const text of ['secret-value', 'secret-default', 'nested-secret', 'Bearer hidden']) {
      expect(screen.queryByText(text)).toBeNull();
    }
    expect(screen.queryByText('nested-default')).toBeNull();
  });

  it('omits empty arrays and duplicate package names and labels repeated arguments', () => {
    render(
      <McpServerMetadata
        server={{
          name: 'example',
          packages: [
            {
              name: 'example-package',
              identifier: 'example-package',
              registryType: 'npm',
              version: '1.0',
              runtimeHint: 'npx',
              runtimeArguments: [],
              packageArguments: [{ name: 'items', isRepeated: true }],
              environmentVariables: [],
            },
          ],
        }}
      />
    );

    const packageRegion = within(screen.getByRole('region', { name: 'Package 1' }));
    expect(packageRegion.getAllByText('example-package')).toHaveLength(2);
    expect(packageRegion.getByText('Repeated:')).toBeTruthy();
    expect(packageRegion.getByText('Yes')).toBeTruthy();
    expect(packageRegion.queryByText('Runtime arguments:')).toBeNull();
    expect(packageRegion.queryByText('Environment variables:')).toBeNull();
  });

  it('omits absent collections and null fields while preserving extension metadata keys', () => {
    render(
      <McpServerMetadata
        server={{
          name: 'minimal',
          packages: null,
          remotes: [],
          websiteUrl: null,
          _meta: { name: 'vendor-name', version: false },
        }}
      />
    );

    expect(screen.queryByRole('region', { name: 'MCP packages' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'MCP remotes' })).toBeNull();
    expect(screen.queryByText('Website URL:')).toBeNull();
    expect(screen.getByText('name:')).toBeTruthy();
    expect(screen.getByText('version:')).toBeTruthy();
    expect(screen.getByText('No')).toBeTruthy();
  });
});
