import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { McpInstallPanel } from './McpInstallPanel';

vi.mock('@/hooks/useServer', () => ({
  useServer: () => ({
    data: {
      remotes: [{ url: 'https://example.com/mcp', type: 'streamable-http' }],
      packages: [
        {
          identifier: 'example-server',
          version: '2.0',
          registryType: 'pypi',
          registryBaseUrl: 'https://private.example/simple',
          runtimeHint: 'uvx',
        },
      ],
    },
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('McpInstallPanel', () => {
  it('passes the package registry to the local VS Code setup', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<McpInstallPanel apiName="example" apiTitle="Example" />);
    fireEvent.click(screen.getByRole('button', { name: /Visual Studio Code/ }));

    const uri = open.mock.calls[0][0] as string;
    expect(uri.startsWith('vscode:mcp/install?')).toBe(true);
    expect(JSON.parse(decodeURIComponent(uri.split('?')[1]))).toEqual({
      name: 'Example',
      type: 'stdio',
      command: 'uvx',
      args: ['--index-url', 'https://private.example/simple', 'example-server@2.0'],
    });
  });

  it('preserves the existing remote install payload', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <McpInstallPanel
        apiName="example"
        apiTitle="Example"
        deployment={{
          name: 'deployment',
          title: 'Deployment',
          environmentId: 'environment',
          server: { runtimeUri: ['https://example.com/mcp'] },
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Visual Studio Code \(remote\)/ }));

    const uri = open.mock.calls[0][0] as string;
    expect(JSON.parse(decodeURIComponent(uri.split('?')[1]))).toEqual({
      name: 'Example (remote)',
      type: 'http',
      transport: 'http',
      url: 'https://example.com/mcp',
    });
  });
});
