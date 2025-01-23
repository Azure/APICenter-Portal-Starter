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

export default function useSearchFilters(): ReturnType {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilters, setActiveFilters] = useState<ActiveFilterData[]>([]);

  // Deserialize active filters from url search params
  useEffect(() => {
    setActiveFilters(
      Object.keys(ApiFilterParameters).flatMap((type: FilterType) => {
        return searchParams.getAll(type).map((value) => ({ type, value }));
      })
    );
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
