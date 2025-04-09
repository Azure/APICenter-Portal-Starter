const LocationsService = {
  getHomeUrl(preserveSearchParams = false): string {
    if (!preserveSearchParams) {
      return '/';
    }

    return `/${window.location.search}`;
  },

  getApiSearchUrl(search?: string, isSemanticSearch?: boolean): string {
    const searchParams = new URLSearchParams(window.location.search);
    if (search) {
      searchParams.set('search', search);
    } else {
      searchParams.delete('search');
    }

    if (isSemanticSearch) {
      searchParams.set('ai-search', 'true');
    } else {
      searchParams.delete('ai-search');
    }

    return `/?${searchParams.toString()}`;
  },

  getApiInfoUrl(name: string): string {
    return `/api-info/${name}${window.location.search}`;
  },

  getApiSchemaExplorerUrl(api: string, version: string, definition: string): string {
    return `/apis/${api}/versions/${version}/definitions/${definition}`;
  },

  getHelpUrl(): string {
    return 'https://learn.microsoft.com/en-us/azure/api-center/overview';
  },
};

export default LocationsService;
