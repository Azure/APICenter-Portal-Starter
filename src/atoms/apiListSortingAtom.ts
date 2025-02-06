import { atom } from 'recoil';
import { SortBy } from '@/types/sorting';
import LocalStorageService from '@/services/LocalStorageService';

const apiListSortingAtom = atom<SortBy>({
  key: 'apiListSorting',
  default: LocalStorageService.get(LocalStorageService.StorageKeys.API_LIST_SORTING),
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

export default apiListSortingAtom;
