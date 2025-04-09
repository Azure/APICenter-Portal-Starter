import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { debounce } from 'lodash';
import { ApiMetadata } from '@/types/api';
import { ActiveFilterData } from '@/types/apiFilters';
import { SortBy, SortByOrder } from '@/types/sorting';
import apiListSortingAtom from '@/atoms/apiListSortingAtom';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import useApiService from '@/hooks/useApiService';

interface Props {
  search?: string;
  filters?: ActiveFilterData[];
  /** If true: won't fetch if search is empty */
  isAutoCompleteMode?: boolean;
  isSemanticSearch?: boolean;
}

interface ReturnType {
  list: ApiMetadata[];
  isLoading: boolean;
}

function sortApis(apis: ApiMetadata[], sortBy?: SortBy): ApiMetadata[] {
  if (!sortBy) {
    return apis;
  }

  return apis.slice().sort((a, b) => {
    let result = 0;
    if (a.title > b.title) {
      result = 1;
    } else {
      result = -1;
    }

    if (sortBy.order === SortByOrder.DESC) {
      return -result;
    }
    return result;
  });
}

/**
 * Provides a list of APIs based on search and filters
 */
export default function useApis({ search, filters, isAutoCompleteMode, isSemanticSearch }: Props = {}): ReturnType {
  const [apis, setApis] = useState<ApiMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);
  const ApiService = useApiService();
  const sortBy = useRecoilValue(apiListSortingAtom);

  const fetchApis = useCallback(
    async (search: string) => {
      if (!isAuthenticated) {
        return;
      }

      try {
        setIsLoading(true);
        setApis(await ApiService.getApis(search, filters, isSemanticSearch));
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, ApiService, filters, isSemanticSearch]
  );

  const fetchApisDebounced = useMemo(() => debounce(fetchApis, 500), [fetchApis]);

  useEffect(() => {
    if (isAutoCompleteMode) {
      if (!search || isSemanticSearch) {
        setApis([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      void fetchApisDebounced(search);
      return;
    }

    void fetchApis(search);
  }, [search, fetchApis, fetchApisDebounced, isAutoCompleteMode, isSemanticSearch]);

  const sortedList = useMemo(() => sortApis(apis, sortBy), [apis, sortBy]);

  return {
    list: sortedList,
    isLoading,
  };
}
