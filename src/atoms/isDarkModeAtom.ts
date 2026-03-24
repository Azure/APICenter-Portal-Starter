import { atom } from 'recoil';

const getInitialDarkMode = (): boolean => {
  const stored = localStorage.getItem('darkMode');
  if (stored !== null) {
    return stored === 'true';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const isDarkModeAtom = atom<boolean>({
  key: 'isDarkMode',
  default: getInitialDarkMode(),
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        localStorage.setItem('darkMode', String(newValue));
      });
    },
  ],
});
