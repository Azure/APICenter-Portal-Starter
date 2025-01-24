import { atom } from 'recoil';
import { ActiveFilterData, FilterType } from '@/types/apiFilters';
import { ApiFilterParameters } from '@/config/apiFilters';

function deserializeFilters(): ActiveFilterData[] {
  const searchParams = new URLSearchParams(window.location.search);
  return Object.keys(ApiFilterParameters).flatMap((type: FilterType) => {
    return searchParams.getAll(type).map((value) => ({ type, value }));
  });
}

const apiSearchFiltersAtom = atom<ActiveFilterData[]>({
  key: 'apiSearchFilters',
  default: deserializeFilters(),
  effects: [
    /**
     * Persist the filters to the URL on change
     */
    ({ onSet }) => {
      onSet((filters) => {
        const url = new URL(window.location.href);

        const filtersByType = Object.fromEntries(Object.keys(ApiFilterParameters).map((key) => [key, []])) as Record<
          FilterType,
          ActiveFilterData[]
        >;

        filters.forEach((entry) => {
          filtersByType[entry.type].push(entry);
        });

        Object.entries(filtersByType).forEach(([type, entries]) => {
          url.searchParams.delete(type);
          entries.forEach((entry) => {
            url.searchParams.append(type, entry.value);
          });
        });

        window.history.pushState({}, '', url);
      });
    },
  ],
});

export default apiSearchFiltersAtom;
