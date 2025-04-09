import React, { useCallback } from 'react';
import { Spinner } from '@fluentui/react-components';
import { Cloud16Regular, Dismiss12Regular, Search16Regular, SparkleRegular } from '@fluentui/react-icons';
import { Link, useNavigate } from 'react-router-dom';
import useRecentSearches, { RecentSearchData, RecentSearchType } from '@/hooks/useRecentSearches.ts';
import { ApiMetadata } from '@/types/api.ts';
import LocationsService from '@/services/LocationsService';
import SemanticSearchToggle from '@/components/SemanticSearchToggle';
import styles from './ApiSearchAutoComplete.module.scss';

interface Props {
  searchResults?: ApiMetadata[];
  isLoading: boolean;
  isSemanticSearchEnabled?: boolean;
  onSemanticSearchSelect?: () => void;
}

const semanticSearchSuggestions = [
  'Find APIs updated in the last 10 days',
  'Search pets for category or breed',
  'Retrieve pets by availability status',
  'Search for pets with specific attributes (color, breed, age)',
  'Find an API to track pet order status',
  'An API to cancel or modify pet orders by tag or label',
  'An API to retrieve details for a specific order',
];

export const ApiSearchAutoComplete: React.FC<Props> = ({
  searchResults,
  isLoading,
  isSemanticSearchEnabled,
  onSemanticSearchSelect,
}) => {
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

  if (!recentSearches.list.length && !searchResults && !isLoading && !onSemanticSearchSelect) {
    return null;
  }

  function renderSemanticSearchOption() {
    if (isSemanticSearchEnabled || !onSemanticSearchSelect) {
      return;
    }

    return (
      <a className={styles.option} onClick={onSemanticSearchSelect}>
        <SemanticSearchToggle />
      </a>
    );
  }

  function renderSemanticSearchSuggestions() {
    return (
      <>
        <h6>Ask things like</h6>

        {semanticSearchSuggestions.map((suggestion) => (
          <Link key={suggestion} to={LocationsService.getApiSearchUrl(suggestion, true)} className={styles.option}>
            <SparkleRegular className={styles.semanticSearchIcon} />
            <span className={styles.semanticSearchSuggestion}>{suggestion}</span>
          </Link>
        ))}
      </>
    );
  }

  function renderRecentSearches() {
    if (!recentSearches.list.length) {
      return null;
    }

    return (
      <>
        <h6>
          Recents
          <button onClick={recentSearches.clear}>Clear</button>
        </h6>

        {recentSearches.list.map((recent) => (
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
        ))}
      </>
    );
  }

  function renderSearchResults() {
    // No results
    if (!searchResults.length) {
      return <div className={styles.noResults}>Could not find APIs. Try a different search term.</div>;
    }

    return (
      <>
        <h6>Suggestions</h6>
        {searchResults.map((api) => (
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
        ))}
      </>
    );
  }

  function renderContent() {
    // Loading spinner
    if (isLoading) {
      return <Spinner size="small" className={styles.noResults} />;
    }

    // Semantic search suggestions
    if (isSemanticSearchEnabled || (!!onSemanticSearchSelect && !recentSearches.list.length)) {
      return renderSemanticSearchSuggestions();
    }

    // Recent searches
    if (!searchResults) {
      return renderRecentSearches();
    }

    return renderSearchResults();
  }

  return (
    <div className={styles.apiSearchAutoComplete}>
      {renderSemanticSearchOption()}
      {renderContent()}
    </div>
  );
};

export default React.memo(ApiSearchAutoComplete);
