import { atom } from 'recoil';

export const isAccessDeniedAtom = atom<boolean>({
  key: 'isAccessDenied',
  default: false,
});
