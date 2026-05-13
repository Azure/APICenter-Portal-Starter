import React, { useCallback } from 'react';
import {
  PlugConnectedRegular,
  BotRegular,
  FlashRegular,
  PuzzlePieceRegular,
  BrainCircuitRegular,
} from '@fluentui/react-icons';
import classNames from 'classnames';
import McpLogo from '@/assets/mcpLogo.svg';
import { useRecoilValue } from 'recoil';
import { isDarkModeAtom } from '@/atoms/isDarkModeAtom';

const McpIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="10 14 168 180" fill="none">
    <path d="M25 97.8528L92.8823 29.9706C102.255 20.598 117.451 20.598 126.823 29.9706V29.9706C136.196 39.3431 136.196 54.5391 126.823 63.9117L75.5581 115.177" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
    <path d="M76.2653 114.47L126.823 63.9117C136.196 54.5391 151.392 54.5391 160.765 63.9117L161.118 64.2652C170.491 73.6378 170.491 88.8338 161.118 98.2063L99.7248 159.6C96.6006 162.724 96.6006 167.789 99.7248 170.913L112.331 183.52" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
    <path d="M109.853 46.9411L59.6482 97.1457C50.2757 106.518 50.2757 121.714 59.6482 131.087V131.087C69.0208 140.459 84.2168 140.459 93.5894 131.087L143.794 80.8822" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
  </svg>
);
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
  { label: 'MCP servers', kindValue: 'mcp', icon: <McpIcon /> },
  // { label: 'Models', kindValue: 'languagemodel', icon: <BrainCircuitRegular /> },
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
