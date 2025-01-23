import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface ReturnType {
  search: string;
  setSearch: (search: string) => void;
  clearSearch: () => void;
}

const SEARCH_PARAM = 'search';

export default function useSearchQuery(): ReturnType {
  const [searchParams, setSearchParams] = useSearchParams();

  const setSearch = useCallback(
    (search: string) => {
      setSearchParams((prev) => {
        const searchParams = new URLSearchParams(prev);

        if (search.length) {
          searchParams.set(SEARCH_PARAM, search);
        } else {
          searchParams.delete(SEARCH_PARAM);
        }

        return searchParams.toString();
      });
    },
    [setSearchParams]
  );

  const clearSearch = useCallback(() => {
    setSearch('');
  }, [setSearch]);

  return {
    search: searchParams.get(SEARCH_PARAM) || '',
    setSearch,
    clearSearch,
  };
}
