import { LanguageModelMetadata } from '@/types/languageModel';
import { PaginatedResult } from '@/types/services/IApiService';

export interface ILanguageModelService {
  getLanguageModels(search?: string): Promise<PaginatedResult<LanguageModelMetadata>>;
  getLanguageModelsByNextLink(nextLink: string): Promise<PaginatedResult<LanguageModelMetadata>>;
  getLanguageModel(name: string): Promise<LanguageModelMetadata>;
}
