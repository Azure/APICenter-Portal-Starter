export interface ApiDeploymentServer {
  runtimeUri: string[];
}

export interface ApiDeployment {
  name: string;
  title: string;
  description?: string;
  environmentId: string;
  server: ApiDeploymentServer;
  /** Indicates whether this is the recommended deployment. */
  recommended?: boolean;
}
