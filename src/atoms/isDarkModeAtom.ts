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
      // Set initial attribute on document for CSS-based dark mode detection
      document.documentElement.setAttribute('data-theme', getInitialDarkMode() ? 'dark' : 'light');

      onSet((newValue) => {
        localStorage.setItem('darkMode', String(newValue));
        document.documentElement.setAttribute('data-theme', newValue ? 'dark' : 'light');
      });
    },
  ],
});
