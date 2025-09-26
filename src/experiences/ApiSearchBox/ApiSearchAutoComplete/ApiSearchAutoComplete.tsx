import React, { useCallback } from 'react';
import { Spinner } from '@fluentui/react-components';
import { Cloud16Regular, Dismiss12Regular, History16Regular, SparkleRegular } from '@fluentui/react-icons';
import { Link, useNavigate } from 'react-router-dom';
import { useRecentSearches, RecentSearchData, RecentSearchType } from '@/hooks/useRecentSearches.ts';
import { ApiMetadata } from '@/types/api.ts';
import { LocationsService } from '@/services/LocationsService';
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

  const handleSemanticSearchSuggestionClick = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>) => {
      recentSearches.add({
        type: RecentSearchType.SEMANTIC_QUERY,
        search: e.currentTarget.innerText,
      });
    },
    [recentSearches]
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

      switch (recentRecord.type) {
        case RecentSearchType.API:
          navigate(LocationsService.getApiInfoUrl(recentRecord.search));
          break;

        case RecentSearchType.QUERY:
          navigate(LocationsService.getApiSearchUrl(recentRecord.search));
          break;

        case RecentSearchType.SEMANTIC_QUERY:
          navigate(LocationsService.getApiSearchUrl(recentRecord.search, true));
          break;
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

  function renderSemanticSearchToggle() {
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
          <Link
            key={suggestion}
            to={LocationsService.getApiSearchUrl(suggestion, true)}
            className={styles.option}
            onClick={handleSemanticSearchSuggestionClick}
          >
            <SparkleRegular className={styles.sparkleIcon} />
            <span className={styles.searchQuery}>{suggestion}</span>
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
            {recent.type === RecentSearchType.API && (
              <>
                <span className={styles.iconWrapper}>
                  <Cloud16Regular />
                </span>
                <span className={styles.apiName}>{recent.search}</span>
                <span className={styles.apiMeta}>
                  {[recent.api.kind, recent.api.lifecycleStage, recent.api.summary].filter(Boolean).join('; ')}
                </span>
              </>
            )}

            {recent.type === RecentSearchType.QUERY && (
              <>
                <span className={styles.iconWrapper}>
                  <History16Regular />
                </span>
                <span className={styles.searchQuery}>{recent.search}</span>
              </>
            )}

            {recent.type === RecentSearchType.SEMANTIC_QUERY && (
              <>
                <span className={styles.iconWrapper}>
                  <SparkleRegular className={styles.sparkleIcon} />
                </span>
                <span className={styles.searchQuery}>{recent.search}</span>
              </>
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
            <span className={styles.apiName}>{api.title}</span>
            <span className={styles.apiMeta}>
              {[api.kind, api.lifecycleStage, api.summary].filter(Boolean).join('; ')}
            </span>
          </Link>
        ))}
      </>
    );
  }

  function renderContent() {
    if (isLoading) {
      return <Spinner size="small" className={styles.noResults} />;
    }

    if (!!onSemanticSearchSelect && !recentSearches.list.length && !searchResults) {
      return renderSemanticSearchSuggestions();
    }

    if (!searchResults) {
      return renderRecentSearches();
    }

    if (isSemanticSearchEnabled) {
      return null;
    }

    return renderSearchResults();
  }

  return (
    <div className={styles.apiSearchAutoComplete}>
      {renderSemanticSearchToggle()}
      {renderContent()}
    </div>
  );
};

export default React.memo(ApiSearchAutoComplete);
