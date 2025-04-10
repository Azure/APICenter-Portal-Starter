import React, { useCallback, useEffect, useState } from 'react';
import { Dismiss16Regular, Search24Regular } from '@fluentui/react-icons';
import { Button, Input } from '@fluentui/react-components';
import { useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import useRecentSearches, { RecentSearchType } from '@/hooks/useRecentSearches.ts';
import useSearchQuery from '@/hooks/useSearchQuery';
import useApis from '@/hooks/useApis';
import configAtom from '@/atoms/configAtom';
import { AppCapabilities } from '@/types/config';
import SemanticSearchToggle from '@/components/SemanticSearchToggle';
import ApiSearchAutoComplete from './ApiSearchAutoComplete';
import styles from './ApiSearchBox.module.scss';

export const ApiSearchBox: React.FC = () => {
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const config = useRecoilValue(configAtom);
  const isSemanticSearchAvailable = config.capabilities.includes(AppCapabilities.SEMANTIC_SEARCH);

  const location = useLocation();
  const apis = useApis({ search: value, isAutoCompleteMode: true, isSemanticSearch });
  const recentSearches = useRecentSearches();
  const searchQuery = useSearchQuery();

  useEffect(() => {
    setValue(searchQuery.search);
  }, [searchQuery.search]);

  useEffect(() => {
    setIsSemanticSearch(searchQuery.isSemanticSearch);
  }, [searchQuery.isSemanticSearch]);

  useEffect(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) {
      return;
    }

    activeElement.blur();
  }, [location]);

  const preventFocusLoss = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

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

  const handleSemanticSearchToggle = useCallback(() => {
    setIsSemanticSearch((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      recentSearches.add({
        type: isSemanticSearch ? RecentSearchType.SEMANTIC_QUERY : RecentSearchType.QUERY,
        search: value,
      });

      searchQuery.setSearch(value, isSemanticSearch);
      e.currentTarget.querySelector('input').blur();
    },
    [isSemanticSearch, recentSearches, searchQuery, value]
  );

  function renderSearchInputMode() {
    if (isSemanticSearch) {
      return <SemanticSearchToggle isEnabled onDisable={handleSemanticSearchToggle} />;
    }

    return <Search24Regular style={{ color: 'var(--blue-3)' }} />;
  }

  let placeholder = 'Search for an API';
  if (isSemanticSearch) {
    placeholder = 'Describe the API you are looking for';
  }

  return (
    <form className={styles.apiSearchBox} onSubmit={handleSubmit}>
      <Input
        className={styles.input}
        size="large"
        contentBefore={renderSearchInputMode()}
        contentAfter={
          !!value && (
            <Button
              appearance="transparent"
              icon={<Dismiss16Regular />}
              onMouseDown={preventFocusLoss}
              onClick={handleClear}
            />
          )
        }
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      {isFocused && (
        <div onMouseDown={preventFocusLoss}>
          <ApiSearchAutoComplete
            searchResults={!!value ? apis.list : undefined}
            isLoading={apis.isLoading && !isSemanticSearch}
            isSemanticSearchEnabled={isSemanticSearch}
            onSemanticSearchSelect={isSemanticSearchAvailable ? handleSemanticSearchToggle : undefined}
          />
        </div>
      )}
    </form>
  );
};

export default React.memo(ApiSearchBox);
