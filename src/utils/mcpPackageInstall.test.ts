import { describe, expect, it } from 'vitest';
import { Package } from '@/types/server';
import { buildMcpPackageCommand } from './mcpPackageInstall';

function packageWith(overrides: Partial<Package>): Package {
  return {
    registryType: 'npm',
    identifier: '@example/server',
    version: '1.2.3',
    runtimeHint: 'npx',
    runtimeArguments: [],
    ...overrides,
  };
}

describe('buildMcpPackageCommand', () => {
  it('passes a private npm registry before a versioned scoped package', () => {
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryBaseUrl: 'https://private.example/npm/',
          runtimeArguments: [{ name: 'verbose', value: '--verbose' }],
        })
      )
    ).toEqual({
      success: true,
      value: {
        command: 'npx',
        args: ['-y', '--registry', 'https://private.example/npm/', '@example/server@1.2.3', '--verbose'],
      },
    });
  });

  it('preserves the existing npx command when no registry is set', () => {
    expect(
      buildMcpPackageCommand(packageWith({ version: '', runtimeArguments: [{ name: 'arg', value: 'server-arg' }] }))
    ).toEqual({
      success: true,
      value: { command: 'npx', args: ['-y', '@example/server', 'server-arg'] },
    });
  });

  it('uses legacy snake_case registry and runtime fields', () => {
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryType: undefined,
          runtimeHint: undefined,
          runtimeArguments: undefined,
          registry_type: 'npm',
          registry_base_url: 'https://legacy.example/npm',
          runtime_hint: 'npx',
          runtime_arguments: [{ name: 'arg', value: '--verbose' }],
        })
      )
    ).toEqual({
      success: true,
      value: {
        command: 'npx',
        args: ['-y', '--registry', 'https://legacy.example/npm', '@example/server@1.2.3', '--verbose'],
      },
    });
  });

  it('infers npx from the npm registry when the runtime hint is absent', () => {
    expect(
      buildMcpPackageCommand(packageWith({ runtimeHint: undefined, registryBaseUrl: 'https://private.example/npm' }))
    ).toEqual({
      success: true,
      value: {
        command: 'npx',
        args: ['-y', '--registry', 'https://private.example/npm', '@example/server@1.2.3'],
      },
    });
  });

  it('generates the PyPI index flag and infers uvx when runtime hint is absent', () => {
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryType: 'pypi',
          identifier: 'example-server',
          runtimeHint: undefined,
          registryBaseUrl: 'https://private.example/simple',
        })
      )
    ).toEqual({
      success: true,
      value: {
        command: 'uvx',
        args: ['--index-url', 'https://private.example/simple', 'example-server@1.2.3'],
      },
    });
  });

  it('prefixes a Docker image with the registry host and version', () => {
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryType: 'oci',
          identifier: 'team/server',
          runtimeHint: 'docker',
          registryBaseUrl: 'https://registry.example:5000/',
          runtimeArguments: [{ name: 'arg', value: '--network=host' }],
        })
      )
    ).toEqual({
      success: true,
      value: {
        command: 'docker',
        args: ['run', '-i', '--rm', '--network=host', 'registry.example:5000/team/server:1.2.3'],
      },
    });
  });

  it('does not duplicate a container registry or an existing image tag', () => {
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryType: 'oci',
          identifier: 'registry.example/team/server:existing',
          runtimeHint: 'docker',
          registryBaseUrl: 'https://registry.example/',
        })
      )
    ).toEqual({
      success: true,
      value: { command: 'docker', args: ['run', '-i', '--rm', 'registry.example/team/server:existing'] },
    });
  });

  it('maps backend docker registry packages to a complete container command', () => {
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryType: 'docker',
          identifier: 'team/server',
          runtimeHint: undefined,
          registryBaseUrl: 'https://registry.example:5000',
        })
      )
    ).toEqual({
      success: true,
      value: {
        command: 'docker',
        args: ['run', '-i', '--rm', 'registry.example:5000/team/server:1.2.3'],
      },
    });
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryType: 'docker',
          identifier: 'team/server',
          runtimeHint: 'docker',
        })
      )
    ).toEqual({
      success: true,
      value: {
        command: 'docker',
        args: ['run', '-i', '--rm', 'team/server:1.2.3'],
      },
    });
  });

  it('matches runtime hints without regard to case', () => {
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryType: undefined,
          runtimeHint: 'NPX',
          registryBaseUrl: 'https://private.example/npm',
        })
      )
    ).toEqual({
      success: true,
      value: {
        command: 'npx',
        args: ['-y', '--registry', 'https://private.example/npm', '@example/server@1.2.3'],
      },
    });
  });

  it('passes the NuGet source after the package reference', () => {
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryType: 'nuget',
          identifier: 'Example.Server',
          runtimeHint: 'dnx',
          registryBaseUrl: 'https://private.example/v3/index.json',
        })
      )
    ).toEqual({
      success: true,
      value: {
        command: 'dnx',
        args: ['Example.Server@1.2.3', '--yes', '--source', 'https://private.example/v3/index.json'],
      },
    });
  });

  it('rejects unsupported registries and runtime combinations instead of dropping the registry', () => {
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryType: 'cargo',
          runtimeHint: 'cargo',
          registryBaseUrl: 'https://private.example',
        })
      )
    ).toEqual({
      success: false,
      error: 'Cannot use the package registry with unsupported registry type "cargo".',
    });
    expect(
      buildMcpPackageCommand(
        packageWith({
          runtimeHint: 'custom-runner',
          registryBaseUrl: 'https://private.example',
        })
      )
    ).toEqual({
      success: false,
      error: 'Cannot use the npm registry with unsupported runtime "custom-runner".',
    });
  });

  it('rejects missing identifiers and invalid Docker registry URLs', () => {
    expect(buildMcpPackageCommand(packageWith({ identifier: '', name: '' }))).toEqual({
      success: false,
      error: 'Cannot install this MCP package: its identifier is missing.',
    });
    expect(
      buildMcpPackageCommand(
        packageWith({
          registryType: 'oci',
          runtimeHint: 'docker',
          registryBaseUrl: 'https://user:password@registry.example',
        })
      )
    ).toEqual({
      success: false,
      error: 'Cannot install this MCP package: its container registry URL is invalid.',
    });
  });
});
