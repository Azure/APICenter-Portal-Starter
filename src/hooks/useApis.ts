import { useRecoilValue } from 'recoil';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ApiMetadata } from '@/types/api';
import { PaginatedResult } from '@/types/services/IApiService';
import { ActiveFilterData } from '@/types/apiFilters';
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

/**
 * Provides a paginated list of APIs based on search and filters
 */
export function useApis({ search, filters, isAutoCompleteMode, isSemanticSearch }: Props = {}) {
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);
  const ApiService = useApiService();
  const sortBy = useRecoilValue(apiListSortingAtom);

  const query = useInfiniteQuery<PaginatedResult<ApiMetadata>>({
    queryKey: [QueryKeys.Apis, search, filters, isAutoCompleteMode, isSemanticSearch, sortBy],
    queryFn: async ({ pageParam }) => {
      if (isAutoCompleteMode && (!search || isSemanticSearch)) {
        return { value: [] };
      }

      if (pageParam) {
        return await ApiService.getApisByNextLink(pageParam as string);
      }

      return await ApiService.getApis(search, filters, isSemanticSearch, sortBy);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextLink,
    staleTime: Infinity,
    enabled: isAuthenticated,
  });

  const data = query.data?.pages.flatMap((page) => page.value);

  return {
    ...query,
    data,
  };
}
