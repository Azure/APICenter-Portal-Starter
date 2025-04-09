import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import configAtom from '@/atoms/configAtom';
import { AppCapabilities } from '@/types/config';

interface ReturnType {
  search: string;
  isSemanticSearch: boolean;
  setSearch: (search: string, isSemanticSearch?: boolean) => void;
  clearSearch: () => void;
}

const SEARCH_PARAM = 'search';
const IS_SEMANTIC_PARAM = 'ai-search';

export default function useSearchQuery(): ReturnType {
  const [searchParams, setSearchParams] = useSearchParams();
  const config = useRecoilValue(configAtom);
  const isSemanticSearchAvailable = config.capabilities.includes(AppCapabilities.SEMANTIC_SEARCH);

  const setSearch = useCallback(
    (search: string, isSemanticSearch?: boolean) => {
      setSearchParams((prev) => {
        const searchParams = new URLSearchParams(prev);

        if (search.length) {
          searchParams.set(SEARCH_PARAM, search);
        } else {
          searchParams.delete(SEARCH_PARAM);
        }

        if (isSemanticSearch) {
          searchParams.set(IS_SEMANTIC_PARAM, 'true');
        } else {
          searchParams.delete(IS_SEMANTIC_PARAM);
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
    isSemanticSearch: isSemanticSearchAvailable && searchParams.get(IS_SEMANTIC_PARAM) === 'true',
    setSearch,
    clearSearch,
  };
}
