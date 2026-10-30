import { Package } from '@/types/server';

type RegistryType = 'npm' | 'pypi' | 'oci' | 'nuget';

interface PackageCommand {
  command: string;
  args: string[];
}

type PackageCommandResult = { success: true; value: PackageCommand } | { success: false; error: string };

const registryCommands: Record<RegistryType, string> = {
  npm: 'npx',
  pypi: 'uvx',
  oci: 'docker',
  nuget: 'dnx',
};

function getRegistryType(registryType: string | undefined, runtimeHint: string | undefined): RegistryType | undefined {
  const type = registryType?.toLowerCase();
  if (type === 'npm' || type === 'pypi' || type === 'oci' || type === 'nuget') return type;
  if (type === 'docker-hub') return 'oci';
  if (type) return undefined;
  return (Object.keys(registryCommands) as RegistryType[]).find((key) => registryCommands[key] === runtimeHint);
}

function getDockerImage(
  identifier: string,
  version: string | undefined,
  registryBaseUrl: string | undefined
): string | undefined {
  let image = identifier;
  if (registryBaseUrl) {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(registryBaseUrl) && !/^https?:\/\//i.test(registryBaseUrl)) return undefined;
    const registry = registryBaseUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    if (!registry || /[\s?#@]/.test(registry)) return undefined;
    if (!image.startsWith(`${registry}/`)) image = `${registry}/${image.replace(/^\/+/, '')}`;
  }
  const imageName = image.split('/').pop() || image;
  if (version && !imageName.includes(':') && !image.includes('@')) image += `:${version}`;
  return image;
}

/**
 * Builds a local MCP command using the package's registry-specific runner.
 *
 * @param pkg - Package metadata returned by the MCP registry.
 * @returns A command and arguments, or a message explaining why installation cannot proceed.
 */
export function buildMcpPackageCommand(pkg: Package): PackageCommandResult {
  const identifier = pkg.identifier || pkg.name;
  if (!identifier?.trim())
    return { success: false, error: 'Cannot install this MCP package: its identifier is missing.' };

  const runtimeHint = pkg.runtimeHint || pkg.runtime_hint;
  const declaredType = pkg.registryType || pkg.registry_type;
  const registryType = getRegistryType(declaredType, runtimeHint);
  const registryBaseUrl = pkg.registryBaseUrl || pkg.registry_base_url;
  const runtimeArgs = (pkg.runtimeArguments ?? pkg.runtime_arguments ?? [])
    .map((arg) => arg.value)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  const packageRef = pkg.version ? `${identifier}@${pkg.version}` : identifier;

  if (!registryType) {
    if (registryBaseUrl) {
      return {
        success: false,
        error: `Cannot use the package registry with unsupported registry type "${declaredType || 'unknown'}".`,
      };
    }
    if (!runtimeHint) return { success: false, error: 'Cannot install this MCP package: its runtime is missing.' };
    return {
      success: true,
      value: {
        command: runtimeHint,
        args: runtimeHint === 'npx' ? ['-y', packageRef, ...runtimeArgs] : runtimeArgs,
      },
    };
  }

  const defaultCommand = registryCommands[registryType];
  if (runtimeHint && runtimeHint !== defaultCommand) {
    if (registryBaseUrl) {
      return {
        success: false,
        error: `Cannot use the ${registryType} registry with unsupported runtime "${runtimeHint}".`,
      };
    }
    return {
      success: true,
      value: {
        command: runtimeHint,
        args: runtimeHint === 'npx' ? ['-y', packageRef, ...runtimeArgs] : runtimeArgs,
      },
    };
  }

  switch (registryType) {
    case 'npm':
      return {
        success: true,
        value: {
          command: defaultCommand,
          args: ['-y', ...(registryBaseUrl ? ['--registry', registryBaseUrl] : []), packageRef, ...runtimeArgs],
        },
      };
    case 'pypi':
      return {
        success: true,
        value: {
          command: defaultCommand,
          args: [...(registryBaseUrl ? ['--index-url', registryBaseUrl] : []), packageRef, ...runtimeArgs],
        },
      };
    case 'oci': {
      const image = getDockerImage(identifier, pkg.version, registryBaseUrl);
      if (!image)
        return { success: false, error: 'Cannot install this MCP package: its container registry URL is invalid.' };
      return { success: true, value: { command: defaultCommand, args: ['run', '-i', '--rm', ...runtimeArgs, image] } };
    }
    case 'nuget':
      return {
        success: true,
        value: {
          command: defaultCommand,
          args: [...runtimeArgs, packageRef, '--yes', ...(registryBaseUrl ? ['--source', registryBaseUrl] : [])],
        },
      };
  }
}
