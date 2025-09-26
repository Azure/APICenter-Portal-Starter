import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { configAtom } from '@/atoms/configAtom';
import { AppCapabilities } from '@/types/config';
import { UrlParams } from '@/constants/urlParams';

interface ReturnType {
  search: string;
  isSemanticSearch: boolean;
  setSearch: (search: string, isSemanticSearch?: boolean) => void;
  clearSearch: () => void;
}

export function useSearchQuery(): ReturnType {
  const [searchParams, setSearchParams] = useSearchParams();
  const config = useRecoilValue(configAtom);
  const isSemanticSearchAvailable = config.capabilities.includes(AppCapabilities.SEMANTIC_SEARCH);

  const setSearch = useCallback(
    (search: string, isSemanticSearch?: boolean) => {
      setSearchParams((prev) => {
        const searchParams = new URLSearchParams(prev);

        if (search.length) {
          searchParams.set(UrlParams.SEARCH_QUERY, search);
        } else {
          searchParams.delete(UrlParams.SEARCH_QUERY);
        }

        if (isSemanticSearch) {
          searchParams.set(UrlParams.IS_SEMANTIC_SEARCH, 'true');
        } else {
          searchParams.delete(UrlParams.IS_SEMANTIC_SEARCH);
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
    search: searchParams.get(UrlParams.SEARCH_QUERY) || '',
    isSemanticSearch: isSemanticSearchAvailable && searchParams.get(UrlParams.IS_SEMANTIC_SEARCH) === 'true',
    setSearch,
    clearSearch,
  };
}
