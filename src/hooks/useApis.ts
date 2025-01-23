import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { Api } from '@/contracts/api';
import { ActiveFilterData } from '@/types/apiFilters';
import { useApiService } from '@/util/useApiService';
import { SortBy, SortByOrder } from '@/types/sorting';
import apiListSortingAtom from '@/atoms/apiListSortingAtom';

interface Props {
  search?: string;
  filters?: ActiveFilterData[];
  /** If true: won't fetch if search is empty */
  isAutoCompleteMode?: boolean;
}

interface ReturnType {
  list: Api[];
  isLoading: boolean;
}

function sortApis(apis: Api[], sortBy?: SortBy): Api[] {
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
  const [apis, setApis] = useState<Api[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sortBy = useRecoilValue(apiListSortingAtom);
  const apiService = useApiService();

  const fetchApis = useCallback(async () => {
    if (isAutoCompleteMode && !search) {
      setApis([]);
      return;
    }

    setIsLoading(true);
    const response = await apiService.getApis(search, filters);
    setApis(response.value);
    setIsLoading(false);
  }, [apiService, filters, isAutoCompleteMode, search]);

  useEffect(() => {
    void fetchApis();
  }, [fetchApis]);

  const sortedList = useMemo(() => sortApis(apis, sortBy), [apis, sortBy]);

  return {
    list: sortedList,
    isLoading,
  };
}
