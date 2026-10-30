import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { McpServerDetailPage } from './McpServerDetailPage';

const mocks = vi.hoisted(() => ({ useServer: vi.fn(), refetch: vi.fn() }));

vi.mock('react-router-dom', () => ({ useParams: () => ({ apiName: 'example' }) }));
vi.mock('@/hooks/useApi', () => ({
  useApi: () => ({ data: { name: 'example', title: 'Example', kind: 'mcp' }, isLoading: false, isError: false }),
}));
vi.mock('@/hooks/useServer', () => ({ useServer: mocks.useServer }));
vi.mock('@/hooks/useMcpTransportTags', () => ({ useMcpTransportTags: () => ({}) }));
vi.mock('@/hooks/useMetadataSchemas', () => ({ useMetadataSchemas: () => ({}) }));
vi.mock('@/components/DetailPageLayout/DetailPageLayout', () => ({
  DetailPageLayout: ({ children, headerActions }: { children: React.ReactNode; headerActions?: React.ReactNode }) => (
    <main>
      {headerActions}
      {children}
    </main>
  ),
}));
vi.mock('@/experiences/ApiDefinitionSelect', () => ({ default: () => null }));
vi.mock('@/experiences/ApiAdditionalInfo', () => ({ default: () => null }));
vi.mock('@/experiences/HeaderActions', () => ({
  HeaderActions: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/pages/ApiSpec/McpSpecPage', () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
  );
});

describe('McpServerDetailPage registry metadata', () => {
  it('displays the backend registry URL on the documentation tab', () => {
    mocks.useServer.mockReturnValue({
      data: { name: 'example', packages: [{ identifier: 'example', registryBaseUrl: 'https://private.example/npm' }] },
    });

    render(<McpServerDetailPage />);
    expect(screen.getByText('https://private.example/npm')).toBeTruthy();
  });

  it('shows registry loading state', () => {
    mocks.useServer.mockReturnValue({ isLoading: true });
    render(<McpServerDetailPage />);
    expect(screen.getByText('Loading MCP registry details...')).toBeTruthy();
  });

  it('shows registry failures and retries the registry request', () => {
    mocks.useServer.mockReturnValue({ isError: true, refetch: mocks.refetch });
    render(<McpServerDetailPage />);
    expect(screen.getByText(/Failed to load MCP registry details/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('includes the package registry in the VS Code install command', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    mocks.useServer.mockReturnValue({
      data: {
        name: 'example',
        packages: [
          {
            identifier: '@example/server',
            registryType: 'npm',
            registryBaseUrl: 'https://private.example/npm/',
            version: '1.2.3',
            runtimeHint: 'npx',
            runtimeArguments: [],
          },
        ],
      },
    });

    render(<McpServerDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: /Install in VS Code/ }));

    const uri = open.mock.calls[0][0] as string;
    expect(uri.startsWith('vscode:mcp/install?')).toBe(true);
    expect(JSON.parse(decodeURIComponent(uri.split('?')[1]))).toEqual({
      name: 'Example',
      type: 'stdio',
      command: 'npx',
      args: ['-y', '--registry', 'https://private.example/npm/', '@example/server@1.2.3'],
    });
  });

  it('maps modern remote types to the VS Code HTTP transport payload', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    mocks.useServer.mockReturnValue({
      data: {
        name: 'example',
        remotes: [{ type: 'streamable-http', url: 'https://example.com/mcp' }],
      },
    });

    render(<McpServerDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: /Install in VS Code/ }));

    const uri = open.mock.calls[0][0] as string;
    expect(JSON.parse(decodeURIComponent(uri.split('?')[1]))).toEqual({
      name: 'Example',
      type: 'http',
      transport: 'http',
      url: 'https://example.com/mcp',
    });
  });

  it('shows an error instead of opening a setup that would ignore the registry', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    mocks.useServer.mockReturnValue({
      data: {
        name: 'example',
        packages: [{ identifier: 'server', registryType: 'cargo', registryBaseUrl: 'https://private.example' }],
      },
    });

    render(<McpServerDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: /Install in VS Code/ }));

    expect(open).not.toHaveBeenCalled();
    expect(screen.getByText('Cannot use the package registry with unsupported registry type "cargo".')).toBeTruthy();
  });
});
