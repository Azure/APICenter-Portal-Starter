export interface PackageArgument {
  name: string;
  description?: string;
  is_required?: boolean;
  value?: string;
}

export interface PackageTransport {
  type: string;
}

export interface Package {
  registryType: string;
  identifier: string;
  version: string;
  runtimeHint: string; // e.g., "npx"
  runtimeArguments: PackageArgument[];
  packageArguments?: PackageArgument[];
  environmentVariables?: PackageArgument[];
  transport?: PackageTransport;
}

export interface Remote {
  transport_type: string;
  url: string;
}

export interface Server {
  $schema?: string;
  name: string;
  title?: string;
  description?: string;
  version?: string;
  packages?: Package[];
  remotes?: Remote[];
}

export interface ServerResponse {
  server: Server;
  _meta?: Record<string, unknown>;
}
