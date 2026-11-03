import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { McpAuthProvider } from '@/contexts/McpAuthContext';
import { ApiAuthCredentials } from '@/types/apiAuth';
import { ApiDeployment } from '@/types/apiDeployment';
import { OperationMetadata, OperationTypes } from '@/types/apiSpec';
import { McpCapabilityTypes } from '@/types/mcp';
import { useMcpTestRunController } from './useMcpTestRunController';

const mocks = vi.hoisted(() => ({ createMcpService: vi.fn() }));

vi.mock('@/services/McpService', () => ({
  createMcpService: mocks.createMcpService,
}));

const credentials: ApiAuthCredentials = {
  in: 'header',
  name: 'Authorization',
  value: 'Bearer test-token',
  createdAt: new Date(0),
};

const operation: OperationMetadata = {
  name: 'tools/example',
  displayName: 'example',
  urlTemplate: '',
  type: OperationTypes.DEFAULT,
  category: McpCapabilityTypes.TOOLS,
  spec: { inputSchema: { type: 'object', properties: {} } },
};

function deployment(transport: string, name = 'deployment'): ApiDeployment {
  return {
    name,
    title: name,
    environmentId: 'environment',
    server: { runtimeUri: ['https://host/sqlcl'], mcpTransportProtocol: transport },
  };
}

function wrapper({ children }: React.PropsWithChildren): React.ReactElement {
  return <McpAuthProvider credentials={credentials}>{children}</McpAuthProvider>;
}

describe('useMcpTestRunController', () => {
  beforeEach(() => {
    mocks.createMcpService.mockReset();
    mocks.createMcpService.mockImplementation((target: ApiDeployment, auth?: ApiAuthCredentials) => ({
      serverUri: target.server.runtimeUri[0],
      declaredTransport: target.server.mcpTransportProtocol,
      authCredentials: auth,
      closeConnection: vi.fn(),
      runTool: vi.fn().mockResolvedValue({ value: 'result' }),
    }));
  });

  afterEach(cleanup);

  it('passes deployment transport and credentials, and replaces the standalone connection on change', async () => {
    const first = deployment('streamable-http', 'first');
    const { result, rerender, unmount } = renderHook(({ target }) => useMcpTestRunController(target, operation, true), {
      initialProps: { target: first },
      wrapper,
    });

    await waitFor(() => expect(mocks.createMcpService).toHaveBeenCalledWith(first, credentials));
    const firstService = mocks.createMcpService.mock.results[0].value;
    await act(async () => result.current.run([]));
    expect(firstService.runTool).toHaveBeenCalledWith('example', {});
    expect(result.current.result).toContain('result');

    const second = deployment('sse', 'second');
    rerender({ target: second });
    await waitFor(() => expect(mocks.createMcpService).toHaveBeenCalledWith(second, credentials));
    expect(firstService.closeConnection).toHaveBeenCalledOnce();
    expect(result.current.result).toBeUndefined();

    const secondService = mocks.createMcpService.mock.results[1].value;
    await act(async () => result.current.run([]));
    expect(secondService.runTool).toHaveBeenCalledWith('example', {});
    unmount();
    expect(secondService.closeConnection).toHaveBeenCalledOnce();
  });

  it('reconnects if transport changes on the same deployment object', async () => {
    const target = deployment('streamable-http');
    const { rerender } = renderHook(({ selected }) => useMcpTestRunController(selected, operation, true), {
      initialProps: { selected: target },
      wrapper,
    });

    await waitFor(() => expect(mocks.createMcpService).toHaveBeenCalledTimes(1));
    const firstService = mocks.createMcpService.mock.results[0].value;
    target.server.mcpTransportProtocol = 'sse';
    rerender({ selected: target });
    await waitFor(() => expect(mocks.createMcpService).toHaveBeenCalledTimes(2));
    expect(firstService.closeConnection).toHaveBeenCalledOnce();
  });

  it('ignores a tool result from a replaced deployment', async () => {
    let finishTool: (value: object) => void;
    const firstResult = new Promise<object>((resolve) => (finishTool = resolve));
    const first = deployment('streamable-http', 'first');
    const { result, rerender } = renderHook(({ target }) => useMcpTestRunController(target, operation, true), {
      initialProps: { target: first },
      wrapper,
    });
    await waitFor(() => expect(mocks.createMcpService).toHaveBeenCalledTimes(1));
    const firstService = mocks.createMcpService.mock.results[0].value;
    firstService.runTool.mockReturnValue(firstResult);

    let pending: Promise<void>;
    act(() => {
      pending = result.current.run([]);
    });
    await waitFor(() => expect(result.current.isRunning).toBe(true));
    rerender({ target: deployment('streamable-http', 'second') });
    await waitFor(() => expect(mocks.createMcpService).toHaveBeenCalledTimes(2));

    await act(async () => {
      finishTool({ value: 'stale' });
      await pending;
    });
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.isRunning).toBe(false);
  });

  it('ignores a tool result after the selected operation changes', async () => {
    let finishTool: (value: object) => void;
    const firstResult = new Promise<object>((resolve) => (finishTool = resolve));
    const target = deployment('streamable-http');
    const { result, rerender } = renderHook(({ selected }) => useMcpTestRunController(target, selected, true), {
      initialProps: { selected: operation },
      wrapper,
    });
    await waitFor(() => expect(mocks.createMcpService).toHaveBeenCalledTimes(1));
    const service = mocks.createMcpService.mock.results[0].value;
    service.runTool.mockReturnValue(firstResult);

    let pending: Promise<void>;
    act(() => {
      pending = result.current.run([]);
    });
    await waitFor(() => expect(result.current.isRunning).toBe(true));
    rerender({ selected: { ...operation, name: 'tools/another', displayName: 'another' } });

    await act(async () => {
      finishTool({ value: 'stale' });
      await pending;
    });
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.isRunning).toBe(false);
    expect(mocks.createMcpService).toHaveBeenCalledTimes(1);
  });

  it('surfaces a transport error from the standalone connection', async () => {
    const target = deployment('unknown');
    const { result } = renderHook(() => useMcpTestRunController(target, operation, true), { wrapper });
    await waitFor(() => expect(mocks.createMcpService).toHaveBeenCalledTimes(1));
    const service = mocks.createMcpService.mock.results[0].value;
    service.runTool.mockRejectedValue(new Error('Unsupported MCP transport: unknown'));

    await act(async () => result.current.run([]));
    expect(result.current.error).toBe('Unsupported MCP transport: unknown');
  });
});
