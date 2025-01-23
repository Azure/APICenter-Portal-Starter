import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dismiss16Regular, Search24Regular } from '@fluentui/react-icons';
import { Input } from '@fluentui/react-components';
import { debounce } from 'lodash';
import { useLocation } from 'react-router-dom';
import { Api } from '@/contracts/api.ts';
import { useSession } from '@/util/useSession.tsx';
import { useApiService } from '@/util/useApiService.ts';
import useRecentSearches, { RecentSearchType } from '@/hooks/useRecentSearches.ts';
import useSearchQuery from '@/hooks/useSearchQuery';
import ApiSearchAutoComplete from './ApiSearchAutoComplete';
import styles from './ApiSearchBox.module.scss';

export const ApiSearchBox: React.FC = () => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoCompleteResults, setAutoCompleteResults] = useState<Api[] | undefined>();

  const location = useLocation();
  const apiService = useApiService();
  const { isAuthenticated } = useSession();
  const recentSearches = useRecentSearches();
  const searchQuery = useSearchQuery();

  useEffect(() => {
    setValue(searchQuery.search);
  }, [searchQuery.search]);

  useEffect(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) {
      return;
    }

    activeElement.blur();
  }, [location]);

  const fetchAutoComplete = useCallback(
    async (search: string) => {
      if (!search || !isAuthenticated) {
        setAutoCompleteResults(undefined);
        return;
      }

      setIsLoading(true);
      const searchResults = await apiService.getApis('$search=' + search);
      setAutoCompleteResults(searchResults.value);
      setIsLoading(false);
    },
    [apiService, isAuthenticated]
  );

  const fetchAutoCompleteDebounced = useMemo(() => debounce(fetchAutoComplete, 500), [fetchAutoComplete]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      void fetchAutoCompleteDebounced(e.target.value);
    },
    [fetchAutoCompleteDebounced]
  );

  const handleClear = useCallback(() => {
    setValue('');
    setAutoCompleteResults([]);

    searchQuery.clearSearch();
  }, [searchQuery]);

  const handleFocus = useCallback(() => {
    void fetchAutoComplete(value);
    setIsFocused(true);
  }, [fetchAutoComplete, value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      recentSearches.add({ type: RecentSearchType.QUERY, search: value });

      searchQuery.setSearch(value);
      e.currentTarget.querySelector('input').blur();
    },
    [recentSearches, searchQuery, value]
  );

  return (
    <form className={styles.apiSearchBox} onSubmit={handleSubmit}>
      <Input
        className={styles.input}
        size="large"
        contentBefore={<Search24Regular style={{ color: 'var(--blue-3)' }} />}
        contentAfter={!!value && <Dismiss16Regular onClick={handleClear} />}
        placeholder="Search for an API"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      {isFocused && (
        <div onMouseDown={(e) => e.preventDefault()}>
          <ApiSearchAutoComplete searchResults={autoCompleteResults} isLoading={isLoading} />
        </div>
      )}
    </form>
  );
};

export default React.memo(ApiSearchBox);
