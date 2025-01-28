import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface ReturnType {
  name: string;
  set: (search: string) => void;
}

const SEARCH_PARAM = 'op';

export default function useSelectedOperation(): ReturnType {
  const [searchParams, setSearchParams] = useSearchParams();

  const set = useCallback(
    (name: string) => {
      setSearchParams((prev) => {
        const searchParams = new URLSearchParams(prev);

        if (name.length) {
          searchParams.set(SEARCH_PARAM, name);
        } else {
          searchParams.delete(SEARCH_PARAM);
        }

        return searchParams.toString();
      });
    },
    [setSearchParams]
  );

  return {
    name: searchParams.get(SEARCH_PARAM) || '',
    set,
  };
}
