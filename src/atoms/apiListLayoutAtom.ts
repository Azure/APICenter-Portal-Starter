import { atom } from 'recoil';
import { Layouts } from '@/types/layouts';
import LocalStorageService from '@/services/LocalStorageService';

const apiListLayoutAtom = atom<Layouts>({
  key: 'apiListLayout',
  default: LocalStorageService.get(LocalStorageService.StorageKeys.API_LIST_LAYOUT) || Layouts.CARDS,
  effects: [
    ({ onSet }) => {
      onSet((value) => {
        LocalStorageService.set(LocalStorageService.StorageKeys.API_LIST_LAYOUT, value);
      });
    },
  ],
});

export default apiListLayoutAtom;
