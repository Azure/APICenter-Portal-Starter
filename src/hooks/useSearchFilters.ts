import { useCallback, useMemo } from 'react';
import { isEqual } from 'lodash';
import { useRecoilState } from 'recoil';
import { ApiFilterParameters } from '@/config/apiFilters';
import { ActiveFilterData, FilterMetadata, FilterType } from '@/types/apiFilters';
import { apiSearchFiltersAtom } from '@/atoms/apiSearchFiltersAtom';
import { useMetadataSchemas } from '@/hooks/useMetadataSchemas';

interface ReturnType {
  activeFilters: ActiveFilterData[];
  metadata: Record<FilterType, FilterMetadata>;
  isActive: (entry: ActiveFilterData) => boolean;
  add: (entry: ActiveFilterData) => void;
  remove: (entry: ActiveFilterData) => void;
  clear: () => void;
}

export function useSearchFilters(): ReturnType {
  const [activeFilters, setActiveFilters] = useRecoilState(apiSearchFiltersAtom);
  const metadataSchemas = useMetadataSchemas();

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

  const metadata = useMemo(() => {
    const combined: Record<FilterType, FilterMetadata> = { ...ApiFilterParameters };

    if (metadataSchemas.data) {
      for (const [name, schema] of metadataSchemas.data) {
        const filterKey = `customProperties/${name}`;
        combined[filterKey] = {
          label: schema.title,
          options: schema.options || [],
        };
      }
    }

    return combined;
  }, [metadataSchemas.data]);

  return {
    activeFilters,
    metadata,
    isActive,
    add,
    remove,
    clear,
  };
}
