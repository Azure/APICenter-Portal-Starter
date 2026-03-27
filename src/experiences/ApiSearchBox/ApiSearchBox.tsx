import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dismiss16Regular, Search24Regular } from '@fluentui/react-icons';
import { Button, Input } from '@fluentui/react-components';
import { useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { useRecentSearches, RecentSearchType } from '@/hooks/useRecentSearches.ts';
import { useSearchQuery } from '@/hooks/useSearchQuery';
import { useApis } from '@/hooks/useApis';
import { configAtom } from '@/atoms/configAtom';
import { AppCapabilities } from '@/types/config';
import SemanticSearchToggle from '@/components/SemanticSearchToggle';
import ApiSearchAutoComplete from './ApiSearchAutoComplete';
import SemanticSearchInfo from './SemanticSearchInfo';
import styles from './ApiSearchBox.module.scss';

export const ApiSearchBox: React.FC = () => {
  const [isSemanticSearchEnabled, setIsSemanticSearchEnabled] = useState(false);
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const autoCompleteRef = useRef<HTMLDivElement>(null);

  const config = useRecoilValue(configAtom);
  const isSemanticSearchAvailable = config.capabilities.includes(AppCapabilities.SEMANTIC_SEARCH);

  const location = useLocation();
  const apis = useApis({ search: value, isAutoCompleteMode: true, isSemanticSearch: isSemanticSearchEnabled });
  const recentSearches = useRecentSearches();
  const searchQuery = useSearchQuery();

  const shouldShowAutoComplete = isFocused && (!isSemanticSearchEnabled || !value);

  useEffect(() => {
    setValue(searchQuery.search);
  }, [searchQuery.search]);

  useEffect(() => {
    setIsSemanticSearchEnabled(searchQuery.isSemanticSearch);
  }, [searchQuery.isSemanticSearch]);

  useEffect(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) {
      return;
    }

    activeElement.blur();
  }, [location]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value, shouldShowAutoComplete]);

  useEffect(() => {
    if (!autoCompleteRef.current) return;
    const options = autoCompleteRef.current.querySelectorAll<HTMLElement>('a');
    options.forEach((opt, i) => {
      if (i === activeIndex) {
        opt.setAttribute('data-active', 'true');
        opt.scrollIntoView({ block: 'nearest' });
      } else {
        opt.removeAttribute('data-active');
      }
    });
  }, [activeIndex]);

  const preventFocusLoss = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!autoCompleteRef.current) return;
    const options = autoCompleteRef.current.querySelectorAll('a');
    if (!options.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev <= 0 ? options.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < options.length) {
      e.preventDefault();
      options[activeIndex].click();
    }
  }, [activeIndex]);

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
    setIsSemanticSearchEnabled((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      recentSearches.add({
        type: isSemanticSearchEnabled ? RecentSearchType.SEMANTIC_QUERY : RecentSearchType.QUERY,
        search: value,
      });

      searchQuery.setSearch(value, isSemanticSearchEnabled);
      e.currentTarget.querySelector('input').blur();
    },
    [isSemanticSearchEnabled, recentSearches, searchQuery, value]
  );

  function renderSearchInputMode() {
    if (isSemanticSearchEnabled) {
      return <SemanticSearchToggle isEnabled onDisable={handleSemanticSearchToggle} />;
    }

    return <Search24Regular style={{ color: 'var(--blue-3)' }} />;
  }

  let placeholder = 'Search the registry';
  if (isSemanticSearchEnabled) {
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
        onKeyDown={handleKeyDown}
      />

      {shouldShowAutoComplete && (
        <div ref={autoCompleteRef} onMouseDown={preventFocusLoss}>
          <ApiSearchAutoComplete
            searchResults={!!value ? apis.data : undefined}
            isLoading={apis.isLoading && !isSemanticSearchEnabled}
            isSemanticSearchEnabled={isSemanticSearchEnabled}
            onSemanticSearchSelect={isSemanticSearchAvailable ? handleSemanticSearchToggle : undefined}
          />
        </div>
      )}

      {isSemanticSearchAvailable && <SemanticSearchInfo isSemanticSearchEnabled={isSemanticSearchEnabled} />}
    </form>
  );
};

export default React.memo(ApiSearchBox);
