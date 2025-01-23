import { useCallback, useEffect, useState } from 'react';
import { isEqual } from 'lodash';
import { useSearchParams } from 'react-router-dom';
import { ApiFilterParameters } from '@/constants';
import { ActiveFilterData, FilterMetadata, FilterType } from '@/types/apiFilters';

interface ReturnType {
  activeFilters: ActiveFilterData[];
  metadata: Record<FilterType, FilterMetadata>;
  isActive: (entry: ActiveFilterData) => boolean;
  add: (entry: ActiveFilterData) => void;
  remove: (entry: ActiveFilterData) => void;
  clear: () => void;
}

function deserializeFilters(searchParams: URLSearchParams): ActiveFilterData[] {
  return Object.keys(ApiFilterParameters).flatMap((type: FilterType) => {
    return searchParams.getAll(type).map((value) => ({ type, value }));
  });
}

export default function useSearchFilters(): ReturnType {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prevParamsStr, setPrevParamsStr] = useState(searchParams.toString());
  const [activeFilters, setActiveFilters] = useState<ActiveFilterData[]>(deserializeFilters(searchParams));

  // Deserialize active filters from url search params
  useEffect(() => {
    // This is the trick to prevent unnecessary changes in the active filters state
    if (prevParamsStr === searchParams.toString()) {
      return;
    }

    setPrevParamsStr(searchParams.toString());
    deserializeFilters(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isActive = useCallback(
    (entry: ActiveFilterData) => {
      return activeFilters.some((e) => isEqual(e, entry));
    },
    [activeFilters]
  );

  // Persist active filters in url search params
  const persist = useCallback(
    (filters: ActiveFilterData[]) => {
      const filtersByType = Object.fromEntries(Object.keys(ApiFilterParameters).map((key) => [key, []])) as Record<
        FilterType,
        ActiveFilterData[]
      >;

      filters.forEach((entry) => {
        filtersByType[entry.type].push(entry);
      });

      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(filtersByType).forEach(([type, entries]) => {
          next.delete(type);
          entries.forEach((entry) => {
            next.append(type, entry.value);
          });
        });

        return next;
      });
    },
    [setSearchParams]
  );

  const add = useCallback(
    (entry: ActiveFilterData) => {
      setActiveFilters((prev) => {
        const next = prev.concat(entry);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const remove = useCallback(
    (entry: ActiveFilterData) => {
      setActiveFilters((prev) => {
        const next = prev.filter((e) => !isEqual(e, entry));
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clear = useCallback(() => {
    setActiveFilters([]);
    persist([]);
  }, [persist]);

  return {
    activeFilters,
    metadata: ApiFilterParameters,
    isActive,
    add,
    remove,
    clear,
  };
}
