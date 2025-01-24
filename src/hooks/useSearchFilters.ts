import { useCallback } from 'react';
import { isEqual } from 'lodash';
import { useRecoilState } from 'recoil';
import { ApiFilterParameters } from '@/config/apiFilters';
import { ActiveFilterData, FilterMetadata, FilterType } from '@/types/apiFilters';
import apiSearchFiltersAtom from '@/atoms/apiSearchFiltersAtom';

interface ReturnType {
  activeFilters: ActiveFilterData[];
  metadata: Record<FilterType, FilterMetadata>;
  isActive: (entry: ActiveFilterData) => boolean;
  add: (entry: ActiveFilterData) => void;
  remove: (entry: ActiveFilterData) => void;
  clear: () => void;
}

export default function useSearchFilters(): ReturnType {
  const [activeFilters, setActiveFilters] = useRecoilState(apiSearchFiltersAtom);

  const isActive = useCallback(
    (entry: ActiveFilterData) => {
      return activeFilters.some((e) => isEqual(e, entry));
    },
    [activeFilters]
  );

  const add = useCallback(
    (entry: ActiveFilterData) => {
      setActiveFilters((prev) => prev.concat(entry));
    },
    [setActiveFilters]
  );

  const remove = useCallback(
    (entry: ActiveFilterData) => {
      setActiveFilters((prev) => prev.filter((e) => !isEqual(e, entry)));
    },
    [setActiveFilters]
  );

  const clear = useCallback(() => {
    setActiveFilters([]);
  }, [setActiveFilters]);

  return {
    activeFilters,
    metadata: ApiFilterParameters,
    isActive,
    add,
    remove,
    clear,
  };
}
