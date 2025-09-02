import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface ReturnType {
  name: string;
  set: (name: string) => void;
  reset: () => void;
}

const SEARCH_PARAM = 'op';

export function useSelectedOperation(): ReturnType {
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

  const reset = useCallback(() => {
    set('');
  }, [set]);

  return {
    name: searchParams.get(SEARCH_PARAM) || '',
    set,
    reset,
  };
}
