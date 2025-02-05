import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiMetadata } from '@/types/api';
import { ActiveFilterData } from '@/types/apiFilters';
import { SortBy, SortByOrder } from '@/types/sorting';
import apiListSortingAtom from '@/atoms/apiListSortingAtom';
import useApiService from '@/hooks/useApiService';

interface Props {
  search?: string;
  filters?: ActiveFilterData[];
  /** If true: won't fetch if search is empty */
  isAutoCompleteMode?: boolean;
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
    if (a.name > b.name) {
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
export default function useApis({ search, filters, isAutoCompleteMode }: Props = {}): ReturnType {
  const [apis, setApis] = useState<ApiMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const ApiService = useApiService();
  const sortBy = useRecoilValue(apiListSortingAtom);

  const fetchApis = useCallback(async () => {
    if (isAutoCompleteMode && !search) {
      setApis([]);
      return;
    }

    try {
      setIsLoading(true);
      setApis(await ApiService.getApis(search, filters));
    } finally {
      setIsLoading(false);
    }
  }, [ApiService, filters, isAutoCompleteMode, search]);

  useEffect(() => {
    void fetchApis();
  }, [fetchApis]);

  const sortedList = useMemo(() => sortApis(apis, sortBy), [apis, sortBy]);

  return {
    list: sortedList,
    isLoading,
  };
}
