import { atom } from 'recoil';
import { Config } from '@/types/config';

export const configAtom = atom<Config>({
  key: 'config',
});
