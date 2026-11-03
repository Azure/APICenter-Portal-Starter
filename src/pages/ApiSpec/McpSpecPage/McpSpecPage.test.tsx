import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiDeployment } from '@/types/apiDeployment';
import { ApiDefinitionId } from '@/types/apiDefinition';
import McpSpecPage from './index';

const mocks = vi.hoisted(() => ({
  apiService: { getSecurityRequirements: vi.fn() },
  definition: { data: { name: 'definition', specification: {} }, isLoading: false },
  getMcpService: vi.fn(),
  getSpecReader: vi.fn(),
  discoverOAuthCredentials: vi.fn(),
  discoverFromWwwAuthenticate: vi.fn(),
}));

vi.mock('@fluentui/react-components', () => ({ Spinner: () => null }));
vi.mock('@/experiences/ApiAccessAuthForm', () => ({
  default: ({ onChange }: { onChange: (value: object) => void }) => (
    <button
      onClick={() =>
        onChange({ name: 'Authorization', value: 'Bearer test-token', in: 'header', createdAt: new Date(0) })
      }
    >
      Authorize
    </button>
  ),
}));
vi.mock('./McpMetadataBasedAuthForm', () => ({ default: () => null }));
vi.mock('@/hooks/useApiService', () => ({ useApiService: () => mocks.apiService }));
vi.mock('@/hooks/useApiDefinition', () => ({ useApiDefinition: () => mocks.definition }));
vi.mock('@/services/McpService', () => ({
  getMcpService: mocks.getMcpService,
  getUnsupportedMcpTransportMessage: (transport?: string | null) =>
    transport != null && transport !== 'sse' && transport !== 'streamable-http'
      ? `Unsupported MCP transport: ${transport}`
      : undefined,
  McpUnauthorizedError: class McpUnauthorizedError extends Error {
    wwwAuthenticate?: string;
  },
}));
vi.mock('@/services/McpAuthService', () => ({
  McpAuthService: {
    discoverOAuthCredentials: mocks.discoverOAuthCredentials,
    discoverFromWwwAuthenticate: mocks.discoverFromWwwAuthenticate,
  },
}));
vi.mock('@/services/McpMsalAuthService', () => ({
  McpMsalAuthService: { acquireToken: vi.fn(), acquireTokenInteractive: vi.fn() },
}));
vi.mock('@/specReaders/getSpecReader', () => ({ getSpecReader: mocks.getSpecReader }));
vi.mock('../ApiSpecPageLayout', () => ({
  default: ({ apiSpec }: { apiSpec?: { label: string } }) => <div data-testid="mcp-spec">{apiSpec?.label}</div>,
}));

const definitionId: ApiDefinitionId = {
  apiName: 'api',
  versionName: 'v1',
  definitionName: 'definition',
};

function deployment(transport: string, name = 'deployment'): ApiDeployment {
  return {
    name,
    title: name,
    environmentId: 'environment',
    server: { runtimeUri: ['https://host/sqlcl'], mcpTransportProtocol: transport },
  };
}

describe('McpSpecPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.apiService.getSecurityRequirements.mockResolvedValue([]);
    mocks.discoverOAuthCredentials.mockResolvedValue(undefined);
    mocks.getSpecReader.mockImplementation(async (spec: string) => ({ type: 'mcp', label: spec }));
    mocks.getMcpService.mockImplementation((target: ApiDeployment) => ({
      collectMcpSpec: vi.fn().mockResolvedValue(target.server.mcpTransportProtocol),
      closeConnection: vi.fn(),
    }));
  });

  afterEach(cleanup);

  it('passes the selected deployment and transport to the shared client', async () => {
    const first = deployment('streamable-http');
    const { rerender } = render(<McpSpecPage definitionId={definitionId} deployment={first} />);

    await waitFor(() => expect(screen.getByTestId('mcp-spec').textContent).toBe('streamable-http'));
    expect(mocks.getMcpService).toHaveBeenCalledWith(first, 'apis/api/v1/definition', undefined);
    const firstService = mocks.getMcpService.mock.results[0].value;

    const second = deployment('sse');
    rerender(<McpSpecPage definitionId={definitionId} deployment={second} />);
    await waitFor(() => expect(screen.getByTestId('mcp-spec').textContent).toBe('sse'));
    expect(mocks.getMcpService).toHaveBeenCalledWith(second, 'apis/api/v1/definition', undefined);
    expect(firstService.closeConnection).toHaveBeenCalledOnce();
  });

  it('does not publish an old deployment result after the selection changes', async () => {
    let finishFirst: (value: string) => void;
    const firstResult = new Promise<string>((resolve) => (finishFirst = resolve));
    mocks.getMcpService.mockImplementation((target: ApiDeployment) => ({
      collectMcpSpec: vi.fn().mockReturnValue(target.name === 'first' ? firstResult : Promise.resolve('second result')),
      closeConnection: vi.fn(),
    }));
    const first = deployment('streamable-http', 'first');
    const { rerender } = render(<McpSpecPage definitionId={definitionId} deployment={first} />);
    await waitFor(() => expect(mocks.getMcpService).toHaveBeenCalledWith(first, 'apis/api/v1/definition', undefined));

    const second = deployment('streamable-http', 'second');
    rerender(<McpSpecPage definitionId={definitionId} deployment={second} />);
    await waitFor(() => expect(screen.getByTestId('mcp-spec').textContent).toBe('second result'));
    await act(async () => {
      finishFirst('stale result');
      await firstResult;
    });

    expect(screen.getByTestId('mcp-spec').textContent).toBe('second result');
    expect(mocks.getSpecReader).not.toHaveBeenCalledWith('stale result', expect.anything());
  });

  it('reconnects when transport changes on the same deployment object', async () => {
    const target = deployment('streamable-http');
    const { rerender } = render(<McpSpecPage definitionId={definitionId} deployment={target} />);
    await waitFor(() => expect(screen.getByTestId('mcp-spec').textContent).toBe('streamable-http'));
    const firstService = mocks.getMcpService.mock.results[0].value;

    target.server.mcpTransportProtocol = 'sse';
    rerender(<McpSpecPage definitionId={definitionId} deployment={target} />);
    await waitFor(() => expect(screen.getByTestId('mcp-spec').textContent).toBe('sse'));
    expect(firstService.closeConnection).toHaveBeenCalledOnce();
    expect(mocks.getMcpService).toHaveBeenCalledTimes(2);
  });

  it('does not reuse credentials when another deployment is selected', async () => {
    mocks.apiService.getSecurityRequirements.mockResolvedValueOnce([{ name: 'configured-auth' }]).mockResolvedValue([]);
    const first = deployment('streamable-http', 'first');
    const { rerender } = render(<McpSpecPage definitionId={definitionId} deployment={first} />);

    fireEvent.click(await screen.findByText('Authorize'));
    await waitFor(() =>
      expect(mocks.getMcpService).toHaveBeenCalledWith(
        first,
        'apis/api/v1/definition',
        expect.objectContaining({ name: 'Authorization', value: 'Bearer test-token' })
      )
    );

    const second = deployment('streamable-http', 'second');
    rerender(<McpSpecPage definitionId={definitionId} deployment={second} />);
    await waitFor(() => expect(mocks.getMcpService).toHaveBeenCalledWith(second, 'apis/api/v1/definition', undefined));
  });

  it('reports an unknown transport before authentication discovery or connection', () => {
    render(<McpSpecPage definitionId={definitionId} deployment={deployment('unknown')} />);

    expect(screen.getByText(/Unsupported MCP transport: unknown/)).toBeTruthy();
    expect(mocks.apiService.getSecurityRequirements).not.toHaveBeenCalled();
    expect(mocks.discoverOAuthCredentials).not.toHaveBeenCalled();
    expect(mocks.getMcpService).not.toHaveBeenCalled();
  });

  it('closes the old connection when the next transport is unsupported', async () => {
    const first = deployment('streamable-http');
    const { rerender } = render(<McpSpecPage definitionId={definitionId} deployment={first} />);
    await waitFor(() => expect(screen.getByTestId('mcp-spec').textContent).toBe('streamable-http'));
    const service = mocks.getMcpService.mock.results[0].value;

    rerender(<McpSpecPage definitionId={definitionId} deployment={deployment('unknown')} />);
    expect(screen.getByText(/Unsupported MCP transport: unknown/)).toBeTruthy();
    expect(service.closeConnection).toHaveBeenCalledOnce();
    expect(mocks.getMcpService).toHaveBeenCalledTimes(1);
  });

  it('uses a fresh connection scope when the definition changes', async () => {
    const target = deployment('streamable-http');
    const { rerender } = render(<McpSpecPage definitionId={definitionId} deployment={target} />);
    await waitFor(() => expect(mocks.getMcpService).toHaveBeenCalledWith(target, 'apis/api/v1/definition', undefined));
    const service = mocks.getMcpService.mock.results[0].value;

    rerender(<McpSpecPage definitionId={{ ...definitionId, versionName: 'v2' }} deployment={target} />);
    await waitFor(() => expect(mocks.getMcpService).toHaveBeenCalledWith(target, 'apis/api/v2/definition', undefined));
    expect(service.closeConnection).toHaveBeenCalledOnce();
  });
});
