export interface ApiDeploymentServer {
  runtimeUri: string[];
  /** MCP transport from the Data API; unknown values must be reported to the user. */
  mcpTransportProtocol?: string | null;
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
