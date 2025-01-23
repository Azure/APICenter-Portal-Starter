import { atom } from 'recoil';
import { RecentSearchData } from '@/hooks/useRecentSearches';
import LocalStorageService from '@/services/LocalStorageService';

const recentSearchesAtom = atom<RecentSearchData[]>({
  key: 'recentSearches',
  default: LocalStorageService.get(LocalStorageService.StorageKeys.RECENT_SEARCHES) || [],
  effects: [
    ({ onSet }) => {
      onSet((value) => {
        LocalStorageService.set(LocalStorageService.StorageKeys.RECENT_SEARCHES, value);
      });
    },
  ],
});

export default recentSearchesAtom;
