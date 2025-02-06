import React, { useCallback, useEffect, useState } from 'react';
import { Dismiss16Regular, Search24Regular } from '@fluentui/react-icons';
import { Input } from '@fluentui/react-components';
import { useLocation } from 'react-router-dom';
import useRecentSearches, { RecentSearchType } from '@/hooks/useRecentSearches.ts';
import useSearchQuery from '@/hooks/useSearchQuery';
import useApis from '@/hooks/useApis';
import ApiSearchAutoComplete from './ApiSearchAutoComplete';
import styles from './ApiSearchBox.module.scss';

export const ApiSearchBox: React.FC = () => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const location = useLocation();
  const apis = useApis({ search: value, isAutoCompleteMode: true });
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setValue('');
    searchQuery.clearSearch();
  }, [searchQuery]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

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
          <ApiSearchAutoComplete searchResults={!!value ? apis.list : undefined} isLoading={apis.isLoading} />
        </div>
      )}
    </form>
  );
};

export default React.memo(ApiSearchBox);
