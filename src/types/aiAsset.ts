/**
 * Shared type definitions for AI asset kinds (agents, skills) in Azure API Center.
 *
 * These assets expose versioned definitions through dedicated endpoints
 * under /{resourceType}/{name}. The definition artifact is markdown.
 */

export type AIAssetResourceType = 'agents' | 'skills';

export interface AIAssetVersion {
  name: string;
  title?: string;
  lifecycleStage?: string;
}

export interface AIAssetArtifact {
  name: string;
  title?: string;
  description?: string;
  type?: 'file' | 'json';
  value?: string;
  contentType?: string;
  fileName?: string;
  contentLengthInBytes?: number;
}
