import { Layouts } from '@/types/layouts';
import { SortBy } from '@/types/sorting';
import { RecentSearchData } from '@/hooks/useRecentSearches';

export enum StorageKeys {
  API_LIST_LAYOUT = 'apiListLayout',
  API_LIST_SORTING = 'apiListSortBy',
  RECENT_SEARCHES = 'recentSearches',
}

type StorageValuesMap = {
  [StorageKeys.API_LIST_LAYOUT]: Layouts;
  [StorageKeys.API_LIST_SORTING]: SortBy;
  [StorageKeys.RECENT_SEARCHES]: RecentSearchData[];
};

const LocalStorageService = {
  StorageKeys,

  get<T extends StorageKeys>(key: T): StorageValuesMap[T] {
    const value = localStorage.getItem(key);
    if (!value) {
      return undefined;
    }
    return JSON.parse(value);
  },

  set<T extends StorageKeys>(key: T, value?: StorageValuesMap[T]) {
    if (value === undefined) {
      this.remove(key);
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  },

  remove<T extends StorageKeys>(key: T) {
    localStorage.removeItem(key);
  },
};

export default LocalStorageService;
