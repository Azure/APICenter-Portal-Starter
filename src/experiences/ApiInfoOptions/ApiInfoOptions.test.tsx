import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configAtom } from '@/atoms/configAtom';
import { ApiInfoOptions } from './ApiInfoOptions';

vi.mock('@/hooks/useApiSpecUrl', () => ({ useApiSpecUrl: () => ({ isLoading: false }) }));
vi.mock('@/hooks/useDeploymentEnvironment', () => ({ useDeploymentEnvironment: () => ({ isLoading: false }) }));
const mocks = vi.hoisted(() => ({ useServer: vi.fn() }));
vi.mock('@/hooks/useServer', () => ({
  useServer: mocks.useServer,
}));

beforeEach(() => {
  mocks.useServer.mockReturnValue({
    isLoading: false,
    data: {
      packages: [
        {
          identifier: 'Example.Server',
          version: '2.0',
          registryType: 'nuget',
          registryBaseUrl: 'https://private.example/v3/index.json',
          runtimeHint: 'dnx',
        },
      ],
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ApiInfoOptions', () => {
  it('includes registry and version in the local VS Code setup', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <RecoilRoot
        initializeState={({ set }) => {
          set(configAtom, {
            dataApiHostName: 'example.data.eastus.azure-apicenter.ms',
            title: 'API portal',
            scopingFilter: '',
            capabilities: [],
          });
        }}
      >
        <ApiInfoOptions api={{ name: 'example', title: 'Example', kind: 'mcp' }} />
      </RecoilRoot>
    );
    fireEvent.click(screen.getByRole('button', { name: /Visual Studio Code/ }));

    const uri = open.mock.calls[0][0] as string;
    expect(uri.startsWith('vscode:mcp/install?')).toBe(true);
    expect(JSON.parse(decodeURIComponent(uri.split('?')[1]))).toEqual({
      name: 'Example',
      type: 'stdio',
      command: 'dnx',
      args: ['Example.Server@2.0', '--yes', '--source', 'https://private.example/v3/index.json'],
    });
  });

  it('maps modern remote types to the VS Code HTTP transport payload', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    mocks.useServer.mockReturnValue({
      isLoading: false,
      data: { remotes: [{ type: 'streamable-http', url: 'https://example.com/mcp' }] },
    });

    render(
      <RecoilRoot
        initializeState={({ set }) => {
          set(configAtom, {
            dataApiHostName: 'example.data.eastus.azure-apicenter.ms',
            title: 'API portal',
            scopingFilter: '',
            capabilities: [],
          });
        }}
      >
        <ApiInfoOptions
          api={{ name: 'example', title: 'Example', kind: 'mcp' }}
          apiDeployment={{
            name: 'deployment',
            title: 'Deployment',
            environmentId: 'environment',
            server: { runtimeUri: ['https://example.com/mcp'] },
          }}
        />
      </RecoilRoot>
    );
    fireEvent.click(screen.getByRole('button', { name: /Visual Studio Code/ }));

    const uri = open.mock.calls[0][0] as string;
    expect(JSON.parse(decodeURIComponent(uri.split('?')[1]))).toEqual({
      name: 'Example',
      type: 'http',
      transport: 'http',
      url: 'https://example.com/mcp',
    });
  });
});
