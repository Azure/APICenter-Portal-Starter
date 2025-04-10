import { atom } from 'recoil';
import appServicesAtom from '@/atoms/appServicesAtom';

const isAuthenticatedAtom = atom<boolean>({
  key: 'isAuthenticated',
  default: false,
  effects: [
    ({ setSelf, getLoadable }): void => {
      // This needs to be run in the next execution frame to allow all atoms to be initialized first
      setTimeout(() => {
        const { AuthService } = getLoadable(appServicesAtom).contents;
        AuthService.isAuthenticated().then(setSelf);
      });
    },
  ],
});

export default isAuthenticatedAtom;
