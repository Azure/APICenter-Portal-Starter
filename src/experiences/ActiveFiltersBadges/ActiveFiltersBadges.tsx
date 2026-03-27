import React, { useCallback } from 'react';
import { Dismiss12Regular } from '@fluentui/react-icons';
import classNames from 'classnames';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { ActiveFilterData, FilterType } from '@/types/apiFilters';
import styles from './ActiveFiltersBadges.module.scss';

interface Props {
  className?: string;
}

export const ActiveFiltersBadges: React.FC<Props> = ({ className }) => {
  const searchFilters = useSearchFilters();

  const handleRemoveClick = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const type = e.currentTarget.getAttribute('data-type') as FilterType;
      const value = e.currentTarget.value;
      const operator = e.currentTarget.getAttribute('data-operator') as ActiveFilterData['operator'];
      searchFilters.remove({ type, value, operator: operator || undefined });
    },
    [searchFilters]
  );

  if (!searchFilters.activeFilters.length) {
    return null;
  }

  function renderFilterBadge(filter: ActiveFilterData) {
    const filterMetadata = searchFilters.metadata[filter.type];
    if (!filterMetadata) return null;
    const optionMetadata = filterMetadata.options.find((option) => option.value === filter.value);

    return (
      <div key={`${filter.type}.${filter.operator}.${filter.value}`} className={styles.filterBadge}>
        {filterMetadata.label} {filter.operator === 'contains' ? 'contains' : '='} <strong>{optionMetadata?.label ?? filter.value}</strong>
        <button title="Remove" data-type={filter.type} data-operator={filter.operator || ''} value={filter.value} onClick={handleRemoveClick}>
          <Dismiss12Regular />
        </button>
      </div>
    );
  }

  return (
    <div className={classNames(styles.activeFiltersBadges, className)}>
      <button className={styles.clearBtn} onClick={searchFilters.clear}>
        Clear all
      </button>

      {searchFilters.activeFilters.map(renderFilterBadge)}
    </div>
  );
};

export default React.memo(ActiveFiltersBadges);
