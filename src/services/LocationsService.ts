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

  getApiDetailsUrl: (name: string) => `/api-details/${name}${window.location.search}`,
};

export default LocationsService;
