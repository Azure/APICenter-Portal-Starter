export enum McpCapabilityTypes {
  PROMPTS = 'prompts',
  RESOURCES = 'resources',
  TOOLS = 'tools',
}

type Role = 'user' | 'assistant';

export interface McpCapabilityInfo {
  subscribe?: boolean;
  listChanged?: boolean;
}

export interface McpInitData {
  protocolVersion: string;
  capabilities: Record<string, McpCapabilityInfo>;
  serverInfo: {
    name: string;
    version: string;
  };
}

interface Annotated {
  annotations?: {
    audience?: Role[];
    priority?: number;
  };
}

export interface McpPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: McpPromptArgument[];
}

export interface McpResource extends Annotated {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  size?: number;
}

export interface McpToolInputProperty {
  type: string;
  description?: string;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: { [key: string]: McpToolInputProperty };
    required?: string[];
  };
}

export type McpOperation = McpPrompt | McpResource | McpTool;

export interface McpSpec {
  [McpCapabilityTypes.PROMPTS]: McpPrompt[];
  [McpCapabilityTypes.RESOURCES]: McpResource[];
  [McpCapabilityTypes.TOOLS]: McpTool[];
}
