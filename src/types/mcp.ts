export enum McpCapabilityTypes {
  PROMPTS = 'prompts',
  RESOURCES = 'resources',
  TOOLS = 'tools',
}

type Role = 'user' | 'assistant';

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

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: { [key: string]: object };
    required?: string[];
  };
}

export interface McpCapabilitiesByType {
  [McpCapabilityTypes.PROMPTS]: McpPrompt[];
  [McpCapabilityTypes.RESOURCES]: McpResource[];
  [McpCapabilityTypes.TOOLS]: McpTool[];
}
