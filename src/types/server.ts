interface PositionalArgument {
  type: 'positional';
  value: string;
  is_required?: boolean;
}

export interface Package {
  registry_name: string;
  name: string;
  version: string;
  runtime_hint: string; // e.g., "npx"
  runtime_arguments: PositionalArgument[];
}

export interface Remote {
  transport_type: string;
  url: string;
}

export interface Server {
  id: string;
  description: string;
  name: string;
  packages?: Package[];
  remotes?: Remote[];
}
