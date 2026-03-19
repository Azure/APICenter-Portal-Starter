import React, { useCallback } from 'react';
import {
  PlugConnectedRegular,
  BotRegular,
  LinkMultipleRegular,
  FlashRegular,
  PuzzlePieceRegular,
} from '@fluentui/react-icons';
import classNames from 'classnames';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { FilterType } from '@/types/apiFilters';
import styles from './CategoryPills.module.scss';

interface CategoryDef {
  label: string;
  kindValue?: string;
  icon?: React.ReactNode;
}

const categories: CategoryDef[] = [
  { label: 'All assets' },
  { label: 'APIs', kindValue: 'rest', icon: <PlugConnectedRegular /> },
  // { label: 'Agents', kindValue: 'agent', icon: <BotRegular /> },
  { label: 'MCP servers', kindValue: 'mcp', icon: <LinkMultipleRegular /> },
  { label: 'Plugins', kindValue: 'plugin', icon: <PuzzlePieceRegular /> },
  { label: 'Skills', kindValue: 'skill', icon: <FlashRegular /> },
];

export const CategoryPills: React.FC = () => {
  const searchFilters = useSearchFilters();

  const activeKindFilters = searchFilters.activeFilters
    .filter((f) => f.type === 'kind')
    .map((f) => f.value);

  const isAllActive = activeKindFilters.length === 0;

  const handleClick = useCallback(
    (kindValue?: string) => {
      // Clear all kind filters first
      searchFilters.activeFilters
        .filter((f) => f.type === 'kind')
        .forEach((f) => searchFilters.remove(f));

      if (kindValue) {
        setTimeout(() => {
          searchFilters.add({ type: 'kind' as FilterType, value: kindValue });
        }, 0);
      }
    },
    [searchFilters],
  );

  return (
    <div className={styles.categoryPills}>
      {categories.map((cat) => {
        const isActive = cat.kindValue
          ? activeKindFilters.includes(cat.kindValue)
          : isAllActive;

        return (
          <button
            key={cat.label}
            className={classNames(styles.pill, isActive && styles.active)}
            onClick={() => handleClick(cat.kindValue)}
            type="button"
          >
            {cat.icon && <span className={styles.icon}>{cat.icon}</span>}
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(CategoryPills);
