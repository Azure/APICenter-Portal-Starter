import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { ApiMetadata } from '@/types/api';
import { ActiveFilterData } from '@/types/apiFilters';
import { SortBy, SortByOrder } from '@/types/sorting';
import { apiListSortingAtom } from '@/atoms/apiListSortingAtom';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

interface Props {
  search?: string;
  filters?: ActiveFilterData[];
  /** If true: won't fetch if search is empty */
  isAutoCompleteMode?: boolean;
  isSemanticSearch?: boolean;
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
export function useApis({ search, filters, isAutoCompleteMode, isSemanticSearch }: Props = {}) {
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);
  const ApiService = useApiService();
  const sortBy = useRecoilValue(apiListSortingAtom);

  return useQuery<ApiMetadata[] | undefined>({
    queryKey: [QueryKeys.Apis, search, isAutoCompleteMode, isSemanticSearch],
    queryFn: async () => {
      if (isAutoCompleteMode && (!search || isSemanticSearch)) {
        return [];
      }

      const apis = await ApiService.getApis(search, filters, isSemanticSearch);
      return sortApis(apis, sortBy);
    },
    staleTime: Infinity,
    enabled: isAuthenticated,
  });
}
