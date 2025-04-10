import { atom } from 'recoil';
import { Config } from '@/types/config';

const configAtom = atom<Config>({
  key: 'config',
});

export default configAtom;
