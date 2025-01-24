import { atom } from 'recoil';

const isAccessDeniedAtom = atom<boolean>({
  key: 'isAccessDenied',
  default: false,
});

export default isAccessDeniedAtom;
