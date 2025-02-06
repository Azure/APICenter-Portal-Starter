import { atom } from 'recoil';
import appServicesAtom from '@/atoms/appServicesAtom';

const isAuthenticatedAtom = atom<boolean>({
  key: 'isAuthenticated',
  default: false,
  effects: [
    ({ setSelf, getLoadable }): void => {
      const { AuthService } = getLoadable(appServicesAtom).contents;
      AuthService.isAuthenticated().then(setSelf);
    },
  ],
});

export default isAuthenticatedAtom;
