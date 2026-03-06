import { atom } from 'recoil';

export const selectedSkillAtom = atom<string | null>({
  key: 'selectedSkill',
  default: null,
});
