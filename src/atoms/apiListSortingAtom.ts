import { atom } from 'recoil';
import { SortBy } from '@/types/sorting';
import LocalStorageService from '@/services/LocalStorageService';

const apiListSortingAtom = atom<SortBy>({
  key: 'apiListSorting',
  default: LocalStorageService.get(LocalStorageService.StorageKeys.API_LIST_SORTING),
  effects: [
    ({ onSet }) => {
      onSet((value) => {
        LocalStorageService.set(LocalStorageService.StorageKeys.API_LIST_SORTING, value);
      });
    },
  ],
});

export default apiListSortingAtom;
