import { HttpService } from '@/services/HttpService';
import { LanguageModelContextWindow, LanguageModelMetadata } from '@/types/languageModel';
import { PaginatedResult } from '@/types/services/IApiService';
import { ILanguageModelService } from '@/types/services/ILanguageModelService';
import { DEFAULT_PAGE_SIZE } from '@/constants';

/**
 * The /apis/{name} response may return language-model-specific properties either at the
 * top level or nested inside customProperties. This function normalises both shapes into
 * a flat LanguageModelMetadata object so that the rest of the app doesn't have to care.
 */
function normalizeLanguageModel(raw: LanguageModelMetadata): LanguageModelMetadata {
  const cp = (raw.customProperties ?? {}) as Record<string, unknown>;
  return {
    ...raw,
    modelName: raw.modelName ?? (cp['modelName'] as string | undefined),
    modelProvider: raw.modelProvider ?? (cp['modelProvider'] as string | undefined),
    taskTypes: raw.taskTypes ?? (cp['taskTypes'] as string[] | undefined),
    inputTypes: raw.inputTypes ?? (cp['inputTypes'] as string[] | undefined),
    outputTypes: raw.outputTypes ?? (cp['outputTypes'] as string[] | undefined),
    contextWindow: raw.contextWindow ?? (cp['contextWindow'] as LanguageModelContextWindow | undefined),
  };
}

export const LanguageModelService: ILanguageModelService = {
  async getLanguageModels(search?: string): Promise<PaginatedResult<LanguageModelMetadata>> {
    const searchParams = new URLSearchParams();
    searchParams.set('$top', String(DEFAULT_PAGE_SIZE));
    if (search?.length) {
      searchParams.set('$search', search);
    }

    const response = await HttpService.get<{ value: LanguageModelMetadata[]; nextLink?: string }>(
      `/apis?${searchParams.toString()}`
    );
    return { value: response?.value || [], nextLink: response?.nextLink };
  },

  async getLanguageModelsByNextLink(nextLink: string): Promise<PaginatedResult<LanguageModelMetadata>> {
    const response = await HttpService.getByUrl<{ value: LanguageModelMetadata[]; nextLink?: string }>(nextLink);
    return { value: response?.value || [], nextLink: response?.nextLink };
  },

  async getLanguageModel(name: string): Promise<LanguageModelMetadata> {
    const raw = await HttpService.get<LanguageModelMetadata>(`/apis/${name}`);
    return normalizeLanguageModel(raw);
  },
};
