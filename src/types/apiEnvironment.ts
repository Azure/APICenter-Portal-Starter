export interface ApiEnvironmentOnboardingInfo {
  /** The instructions how to onboard to the environment. */
  instructions?: string;
  /** The developer portal URIs of the environment. */
  developerPortalUri?: string[];
}

export interface ApiEnvironmentServer {
  /** The type of the server that represents the environment. */
  type?: string;
  managementPortalUri?: string[];
}

export interface ApiEnvironment {
  name: string;
  title: string;
  /** The kind of the deployment environment, e.g., "Production". */
  kind: string;
  description?: string;
  server?: ApiEnvironmentServer;
  onboarding?: ApiEnvironmentOnboardingInfo;
}
