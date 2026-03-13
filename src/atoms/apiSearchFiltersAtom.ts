import { atom } from 'recoil';
import { ActiveFilterData, FilterOperator, FilterType } from '@/types/apiFilters';
import { ApiFilterParameters } from '@/config/apiFilters';

const OPERATOR_SEPARATOR = '::';

function deserializeFilters(): ActiveFilterData[] {
  const searchParams = new URLSearchParams(window.location.search);
  const filters: ActiveFilterData[] = [];

  searchParams.forEach((rawValue, key) => {
    const isKnownFilter = key in ApiFilterParameters;
    const isCustomProperty = key.startsWith('customProperties/');

    if (!isKnownFilter && !isCustomProperty) return;

    let operator: FilterOperator | undefined;
    let value = rawValue;

    const sepIndex = rawValue.indexOf(OPERATOR_SEPARATOR);
    if (sepIndex !== -1) {
      operator = rawValue.substring(0, sepIndex) as FilterOperator;
      value = rawValue.substring(sepIndex + OPERATOR_SEPARATOR.length);
    }

    filters.push({ type: key, value, operator });
  });

  return filters;
}

export const apiSearchFiltersAtom = atom<ActiveFilterData[]>({
  key: 'apiSearchFilters',
  default: deserializeFilters(),
  effects: [
    /**
     * Persist the filters to the URL on change
     */
    ({ onSet }): void => {
      onSet((filters) => {
        const url = new URL(window.location.href);

        // Collect all filter types (both static and dynamic)
        const allTypes = new Set<string>([
          ...Object.keys(ApiFilterParameters),
          ...filters.map((f) => f.type),
        ]);

        const filtersByType: Record<string, ActiveFilterData[]> = {};
        for (const type of allTypes) {
          filtersByType[type] = [];
        }

        filters.forEach((entry) => {
          filtersByType[entry.type].push(entry);
        });

        Object.entries(filtersByType).forEach(([type, entries]) => {
          url.searchParams.delete(type);
          entries.forEach((entry) => {
            const serialized = entry.operator
              ? `${entry.operator}${OPERATOR_SEPARATOR}${entry.value}`
              : entry.value;
            url.searchParams.append(type, serialized);
          });
        });

        window.history.pushState({}, '', url);
      });
    },
  ],
});
