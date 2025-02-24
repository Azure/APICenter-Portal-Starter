import { atom } from 'recoil';
import { Layouts } from '@/types/layouts';
import LocalStorageService from '@/services/LocalStorageService';

const apiListLayoutAtom = atom<Layouts>({
  key: 'apiListLayout',
  default: LocalStorageService.get(LocalStorageService.StorageKeys.API_LIST_LAYOUT) || Layouts.TABLE,
  effects: [
    /**
     * Persist the layout setting to local storage on change
     */
    ({ onSet }): void => {
      onSet((value) => {
        LocalStorageService.set(LocalStorageService.StorageKeys.API_LIST_LAYOUT, value);
      });
    },
  ],
});

export default apiListLayoutAtom;
