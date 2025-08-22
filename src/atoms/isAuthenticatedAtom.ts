import { atom } from 'recoil';
import appServicesAtom from '@/atoms/appServicesAtom';
import { IAuthService } from '@/types/services/IAuthService';

const isAuthenticatedAtom = atom<boolean>({
  key: 'isAuthenticated',
  default: false,
  effects: [
    ({ setSelf, getLoadable }): void => {
      // This needs to be run in the next execution frame to allow all atoms to be initialized first
      const tryResolve = () => {
        const services = getLoadable(appServicesAtom).contents as { AuthService?: IAuthService } | undefined;
        const auth = services?.AuthService;

        if (!auth) {
          // Retry on next tick until services are initialized
          setTimeout(tryResolve, 0);
          return;
        }

        auth
          .isAuthenticated()
          .then(setSelf)
          .catch(() => setSelf(false));
      };

      setTimeout(tryResolve, 0);
    },
  ],
});

export default isAuthenticatedAtom;
