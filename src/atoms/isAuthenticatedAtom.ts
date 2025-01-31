import { atom } from 'recoil';
import MsalAuthService from '@/services/MsalAuthService';

const isAuthenticatedAtom = atom<boolean>({
  key: 'isAuthenticated',
  default: false,
  effects: [
    ({ setSelf }) => {
      MsalAuthService.isAuthenticated().then(setSelf);
    },
  ],
});

export default isAuthenticatedAtom;
