import { atom } from 'recoil';
import appServicesAtom from '@/atoms/appServicesAtom';
import { IAuthService } from '@/types/services/IAuthService';

const isAuthenticatedAtom = atom<boolean>({
  key: 'isAuthenticated',
  default: false,
  effects: [
    ({ setSelf, getLoadable }): void => {
      const tryResolve = (): void => {
        const services = getLoadable(appServicesAtom).contents as { AuthService?: IAuthService } | undefined;
        const auth = services?.AuthService;
        if (!auth) {
          // Retry on next tick until services are initialized
          setTimeout(tryResolve);
          return;
        }

        auth
          .isAuthenticated()
          .then(setSelf)
          .catch(() => setSelf(false));
      };

      setTimeout(tryResolve);
    },
  ],
});

export default isAuthenticatedAtom;
