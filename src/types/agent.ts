/**
 * Type definitions for agent assets in Azure API Center.
 *
 * APIs of kind "agent" expose versioned definitions through dedicated
 * endpoints under /agents/{name}. The definition artifact is markdown.
 */

export interface AgentVersion {
  name: string;
  title?: string;
  lifecycleStage?: string;
}

export interface AgentArtifact {
  name: string;
  contentType?: string;
}
