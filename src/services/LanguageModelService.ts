import { HttpService } from '@/services/HttpService';
import { LanguageModelMetadata } from '@/types/languageModel';
import { PaginatedResult } from '@/types/services/IApiService';
import { ILanguageModelService } from '@/types/services/ILanguageModelService';
import { DEFAULT_PAGE_SIZE } from '@/constants';

export const LanguageModelService: ILanguageModelService = {
  async getLanguageModels(search?: string): Promise<PaginatedResult<LanguageModelMetadata>> {
    const searchParams = new URLSearchParams();
    searchParams.set('$top', String(DEFAULT_PAGE_SIZE));
    if (search?.length) {
      searchParams.set('$search', search);
    }

    const response = await HttpService.get<{ value: LanguageModelMetadata[]; nextLink?: string }>(
      `/languageModels?${searchParams.toString()}`
    );
    return { value: response?.value || [], nextLink: response?.nextLink };
  },

  async getLanguageModelsByNextLink(nextLink: string): Promise<PaginatedResult<LanguageModelMetadata>> {
    const response = await HttpService.getByUrl<{ value: LanguageModelMetadata[]; nextLink?: string }>(nextLink);
    return { value: response?.value || [], nextLink: response?.nextLink };
  },

  async getLanguageModel(name: string): Promise<LanguageModelMetadata> {
    return await HttpService.get<LanguageModelMetadata>(`/languageModels/${name}`);
  },
};
