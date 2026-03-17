export interface PluginResource {
  title: string;
  summary?: string;
  kind: string;
}

export interface PluginDetails {
  name: string;
  title: string;
  description?: string;
  version?: string;
  resources: Record<string, PluginResource>;
}
