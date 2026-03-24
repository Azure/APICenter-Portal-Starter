import { UrlParams } from '@/constants/urlParams';
import { ResourceType } from '@/types/apiDefinition';

export const LocationsService = {
  getHomeUrl(preserveSearchParams = false): string {
    if (!preserveSearchParams) {
      return '/';
    }

    return `/${window.location.search}`;
  },

  getApiSearchUrl(search?: string, isSemanticSearch?: boolean): string {
    const searchParams = new URLSearchParams(window.location.search);
    if (search) {
      searchParams.set(UrlParams.SEARCH_QUERY, search);
    } else {
      searchParams.delete(UrlParams.SEARCH_QUERY);
    }

    if (isSemanticSearch) {
      searchParams.set(UrlParams.IS_SEMANTIC_SEARCH, 'true');
    } else {
      searchParams.delete(UrlParams.IS_SEMANTIC_SEARCH);
    }

    return `/?${searchParams.toString()}`;
  },

  getSkillInfoUrl(name: string): string {
    return `/skills/${name}`;
  },

  getPluginInfoUrl(name: string): string {
    return `/plugins/${name}`;
  },

  getAgentChatUrl(name: string): string {
    return `/agents/${name}`;
  },

  getModelPlaygroundUrl(name: string): string {
    return `/languageModels/${name}/playground`;
  },

  getApiSchemaExplorerUrl(api: string, version: string, definition: string, resourceType: ResourceType = 'apis'): string {
    return `/${resourceType}/${api}/versions/${version}/definitions/${definition}`;
  },

  getAiSearchInfoUrl(): string {
    return 'https://aka.ms/apicenter/docs/search';
  },

  getHelpUrl(): string {
    return 'https://learn.microsoft.com/en-us/azure/api-center/overview';
  },
};
