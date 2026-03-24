import { ApiContact, ApiExternalDocumentation } from './api';

export interface LanguageModelContextWindow {
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * The Language Model contract returned by the /languageModels endpoint.
 */
export interface LanguageModelMetadata {
  name: string;
  title: string;
  summary?: string;
  description?: string;
  modelName?: string;
  modelProvider?: string;
  taskTypes?: string[];
  inputTypes?: string[];
  outputTypes?: string[];
  contextWindow?: LanguageModelContextWindow;
  lifecycleStage?: string;
  contacts?: ApiContact[];
  externalDocumentation?: ApiExternalDocumentation[];
  customProperties?: Record<string, unknown>;
  lastUpdated?: string;
}

const PLAYGROUND_TASK_TYPES = ['chatCompletion', 'responses'];

/**
 * Returns true when a language model supports an interactive playground
 * (i.e. its taskTypes include chatCompletion or responses).
 */
export function supportsPlayground(model: LanguageModelMetadata): boolean {
  return !!model.taskTypes?.some((t) => PLAYGROUND_TASK_TYPES.includes(t));
}
