const LocationsService = {
  getHomeUrl(preserveSearchParams = false): string {
    if (!preserveSearchParams) {
      return '/';
    }

    return `/${window.location.search}`;
  },

  getApiSearchUrl(search?: string): string {
    const searchParams = new URLSearchParams(window.location.search);
    if (search) {
      searchParams.set('search', search);
    } else {
      searchParams.delete('search');
    }

    return `/?${searchParams.toString()}`;
  },

  getApiInfoUrl(name: string): string {
    return `/api-info/${name}${window.location.search}`;
  },

  getApiSchemaExplorerUrl(api: string, version: string, definition: string): string {
    return `/swagger/${api}/${version}/${definition}`;
  },

  getHelpUrl(): string {
    return 'https://learn.microsoft.com/en-us/azure/api-center/overview';
  },
};

export default LocationsService;
