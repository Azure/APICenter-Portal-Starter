import { atom } from 'recoil';
import { SortBy, SortByOrder } from '@/types/sorting';
import { LocalStorageService } from '@/services/LocalStorageService';

const defaultSortBy: SortBy = {
  field: 'name',
  order: SortByOrder.ASC,
};

export const apiListSortingAtom = atom<SortBy>({
  key: 'apiListSorting',
  default: LocalStorageService.get(LocalStorageService.StorageKeys.API_LIST_SORTING) || defaultSortBy,
  effects: [
    /**
     * Persist sorting to the local storage on change
     */
    ({ onSet }): void => {
      onSet((value) => {
        LocalStorageService.set(LocalStorageService.StorageKeys.API_LIST_SORTING, value);
      });
    },
  ],
});
