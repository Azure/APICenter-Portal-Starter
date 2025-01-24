const LocationsService = {
  getHomeUrl: () => '/',

  getApiSearchUrl: (search?: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    if (search) {
      searchParams.set('search', search);
    } else {
      searchParams.delete('search');
    }

    return `/?${searchParams.toString()}`;
  },

  getApiInfoUrl: (name: string) => `/api-info/${name}${window.location.search}`,

  getApiSchemaExplorerUrl: (api: string, version: string, definition: string) =>
    `/swagger/${api}/${version}/${definition}`,
};

export default LocationsService;
