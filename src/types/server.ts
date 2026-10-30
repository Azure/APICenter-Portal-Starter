export interface PackageArgument {
  name: string;
  description?: string;
  is_required?: boolean;
  isRequired?: boolean;
  is_secret?: boolean;
  isSecret?: boolean;
  type?: 'named' | 'positional';
  format?: string;
  default?: string;
  choices?: string[];
  placeholder?: string;
  valueHint?: string;
  value_hint?: string;
  value?: string;
  variables?: Record<string, PackageInput>;
}

export interface PackageInput extends Omit<PackageArgument, 'name' | 'type'> {
  name?: string;
}

export interface PackageTransport {
  type: string;
  url?: string;
  headers?: PackageArgument[];
}

export interface Package {
  registryType: string;
  registryBaseUrl?: string;
  registry_base_url?: string;
  registry_type?: string;
  name?: string;
  fileSha256?: string;
  file_sha256?: string;
  identifier: string;
  version: string;
  runtimeHint: string; // e.g., "npx"
  runtimeArguments: PackageArgument[];
  packageArguments?: PackageArgument[];
  environmentVariables?: PackageArgument[];
  runtime_hint?: string;
  runtime_arguments?: PackageArgument[];
  package_arguments?: PackageArgument[];
  environment_variables?: PackageArgument[];
  transport?: PackageTransport;
}

export interface Remote {
  transport_type: string;
  type?: string;
  url: string;
  headers?: PackageArgument[];
  variables?: Record<string, PackageInput>;
}

export interface Server {
  $schema?: string;
  name: string;
  title?: string;
  description?: string;
  version?: string;
  websiteUrl?: string;
  website_url?: string;
  repository?: {
    id?: string;
    source?: string;
    subfolder?: string;
    url?: string;
  };
  status?: 'active' | 'deprecated';
  icons?: Array<{
    src: string;
    mimeType?: string;
    sizes?: string[];
    theme?: 'light' | 'dark';
  }>;
  _meta?: Record<string, unknown>;
  registryMetadata?: Record<string, unknown>;
  packages?: Package[];
  remotes?: Remote[];
}

export interface ServerResponse {
  server: Server;
  _meta?: Record<string, unknown>;
}
