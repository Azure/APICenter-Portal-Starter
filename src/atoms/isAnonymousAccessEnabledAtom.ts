import { selector } from 'recoil';
import configAtom from './configAtom';

const isAnonymousAccessEnabledAtom = selector<boolean>({
  key: 'isAnonymousAccessEnabled',
  get: ({ get }) => {
    const config = get(configAtom);
    return !config?.authentication;
  },
});

export default isAnonymousAccessEnabledAtom;