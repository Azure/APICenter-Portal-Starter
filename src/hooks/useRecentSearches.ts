import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { ApiMetadata } from '@/types/api.ts';
import recentSearchesAtom from '@/atoms/recentSearchesAtom';

export enum RecentSearchType {
  API = 'api',
  QUERY = 'query',
}

export interface RecentSearchData {
  id: string;
  type: RecentSearchType;
  search: string;
  api?: ApiMetadata;
}

export type RecentSearchDataDTO = Omit<RecentSearchData, 'id'>;

interface ReturnType {
  list: RecentSearchData[];
  add: (data: RecentSearchDataDTO) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export default function useRecentSearches(): ReturnType {
  const [recentSearches, setRecentSearches] = useRecoilState(recentSearchesAtom);

  const add = useCallback(
    (data: RecentSearchData) => {
      if (!data.search) {
        return;
      }

      const id = `${data.type}.${data.search}`;
      if (recentSearches.find((recent) => recent.id === id)) {
        return;
      }

      setRecentSearches((list) => list.concat({ ...data, id }));
    },
    [recentSearches, setRecentSearches]
  );

  const remove = useCallback(
    (id: string) => {
      setRecentSearches((list) => list.filter((record) => record.id !== id));
    },
    [setRecentSearches]
  );

  const clear = useCallback(() => {
    setRecentSearches([]);
  }, [setRecentSearches]);

  return {
    list: recentSearches || [],
    add,
    remove,
    clear,
  };
}
