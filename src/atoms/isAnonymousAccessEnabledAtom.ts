import { selector } from 'recoil';
import { configAtom } from './configAtom';

export const isAnonymousAccessEnabledAtom = selector<boolean>({
  key: 'isAnonymousAccessEnabled',
  get: ({ get }) => {
    const config = get(configAtom);
    return !config?.authentication;
  },
});
