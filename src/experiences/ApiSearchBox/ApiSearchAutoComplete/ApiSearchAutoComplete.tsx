import React, { useCallback } from 'react';
import { Spinner } from '@fluentui/react-components';
import { Cloud16Regular, Dismiss12Regular, Search16Regular } from '@fluentui/react-icons';
import { Link, useNavigate } from 'react-router-dom';
import useRecentSearches, { RecentSearchData, RecentSearchType } from '@/hooks/useRecentSearches.ts';
import { ApiMetadata } from '@/types/api.ts';
import LocationsService from '@/services/LocationsService';
import styles from './ApiSearchAutoComplete.module.scss';

interface Props {
  searchResults?: ApiMetadata[];
  isLoading: boolean;
}

export const ApiSearchAutoComplete: React.FC<Props> = ({ searchResults, isLoading }) => {
  const navigate = useNavigate();
  const recentSearches = useRecentSearches();

  const handleSearchResultClick = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>) => {
      const name = e.currentTarget.getAttribute('data-name');
      const api = searchResults!.find((api) => api.name === name);
      if (!api) {
        return;
      }

      recentSearches.add({
        type: RecentSearchType.API,
        search: api.name,
        api,
      });

      navigate(LocationsService.getApiInfoUrl(api.name));
    },
    [navigate, recentSearches, searchResults]
  );

  const getRecentRecordUrl = useCallback((recentRecord: RecentSearchData) => {
    if (recentRecord.type === RecentSearchType.API) {
      return LocationsService.getApiInfoUrl(recentRecord.search);
    }

    return LocationsService.getApiSearchUrl(recentRecord.search);
  }, []);

  const handleRecentClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.button !== 0) {
        return;
      }

      e.preventDefault();
      const id = e.currentTarget.getAttribute('data-id');
      const recentRecord = recentSearches.list.find((record) => record.id === id);

      if (!recentRecord) {
        return;
      }

      if (recentRecord.type === RecentSearchType.API) {
        navigate(LocationsService.getApiInfoUrl(recentRecord.search));
      } else {
        navigate(LocationsService.getApiSearchUrl(recentRecord.search));
      }
    },
    [navigate, recentSearches.list]
  );

  const handleRecentRemoveClick = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      recentSearches.remove(e.currentTarget.value);
    },
    [recentSearches]
  );

  if (!recentSearches.list.length && !searchResults && !isLoading) {
    return null;
  }

  function renderHeader() {
    if (searchResults?.length) {
      return <h6>Suggestions</h6>;
    }

    if (recentSearches.list.length) {
      return (
        <h6>
          Recents
          <button onClick={recentSearches.clear}>Clear</button>
        </h6>
      );
    }

    return null;
  }

  function renderContent() {
    // Loading spinner
    if (isLoading) {
      return <Spinner size="small" className={styles.noResults} />;
    }

    // Recent searches
    if (!searchResults) {
      return recentSearches.list.map((recent) => (
        <Link
          key={recent.id}
          to={getRecentRecordUrl(recent)}
          className={styles.option}
          data-id={recent.id}
          onClick={handleRecentClick}
        >
          {recent.type === 'api' ? <Cloud16Regular /> : <Search16Regular />}
          <span className={styles.apiName}>{recent.search}</span>
          {recent.api && (
            <span className={styles.apiMeta}>
              {recent.api.kind}; {recent.api.lifecycleStage && `${recent.api.lifecycleStage};`}; {recent.api.summary}
            </span>
          )}

          <button className={styles.deleteBtn} value={recent.id} onClick={handleRecentRemoveClick}>
            <Dismiss12Regular />
          </button>
        </Link>
      ));
    }

    // No results
    if (!searchResults.length) {
      return <div className={styles.noResults}>Could not find APIs. Try a different search term.</div>;
    }

    // Search results
    return searchResults.map((api) => (
      <Link
        key={api.name}
        to={LocationsService.getApiInfoUrl(api.name)}
        className={styles.option}
        data-name={api.name}
        onClick={handleSearchResultClick}
      >
        <Cloud16Regular />
        <span className={styles.apiName}>{api.name}</span>
        <span className={styles.apiMeta}>
          {api.kind}; {api.lifecycleStage && `${api.lifecycleStage};`} {api.summary}
        </span>
      </Link>
    ));
  }

  return (
    <div className={styles.apiSearchAutoComplete}>
      {renderHeader()}
      {renderContent()}
    </div>
  );
};

export default React.memo(ApiSearchAutoComplete);
