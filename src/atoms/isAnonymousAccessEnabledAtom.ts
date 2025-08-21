import { atom } from 'recoil';
import configAtom from './configAtom';

const isAnonymousAccessEnabledAtom = atom<boolean>({
  key: 'isAnonymousAccessEnabled',
  default: false,
  effects: [
    ({ setSelf, getLoadable }) => {
      // This needs to be run in the next execution frame to allow all atoms to be initialized first
      setTimeout(() => {
        const config = getLoadable(configAtom).contents;
        setSelf(!config?.authentication);
      });
    },
  ],
});

export default isAnonymousAccessEnabledAtom;