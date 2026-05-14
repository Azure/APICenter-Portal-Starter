import React, { useCallback } from 'react';
import {
  PlugConnectedRegular,
  BoxMultipleRegular,
} from '@fluentui/react-icons';
import classNames from 'classnames';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { FilterType } from '@/types/apiFilters';
import styles from './CategoryPills.module.scss';

// VS Code Codicons — aligned with VS Code Agents app iconography
const AgentIcon: React.FC = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M5.10198 3C4.92335 3 4.75829 3.0953 4.66897 3.25L2.07089 7.75C1.98158 7.9047 1.98158 8.0953 2.07089 8.25L4.5746 12.5866C4.72231 12.8424 4.99529 13 5.29071 13C5.65144 13 5.97055 12.7662 6.0792 12.4222L8.96823 3.27622C9.20821 2.51649 9.913 2 10.7097 2C11.3622 2 11.9651 2.34809 12.2914 2.91316L14.7953 7.25C15.0632 7.7141 15.0632 8.2859 14.7953 8.75L12.1972 13.25C11.9292 13.7141 11.434 14 10.8981 14H8.50155C8.22541 14 8.00155 13.7761 8.00155 13.5C8.00155 13.2239 8.22541 13 8.50155 13H10.8981C11.0768 13 11.2418 12.9047 11.3311 12.75L13.9292 8.25C14.0185 8.0953 14.0185 7.9047 13.9292 7.75L11.4254 3.41316C11.2777 3.1575 11.005 3 10.7097 3C10.3493 3 10.0304 3.23369 9.92179 3.57743L7.03276 12.7234C6.7927 13.4834 6.08769 14 5.29071 14C4.63803 14 4.03492 13.6518 3.70858 13.0866L1.20487 8.75C0.936918 8.2859 0.936919 7.7141 1.20487 7.25L3.80295 2.75C4.07089 2.2859 4.56609 2 5.10198 2H7.50155C7.77769 2 8.00155 2.22386 8.00155 2.5C8.00155 2.77614 7.77769 3 7.50155 3H5.10198Z"/></svg>
);

const SkillIcon: React.FC = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1C5.419 1 2.75 2.964 2.75 6.25C2.75 8.167 3.637 9.184 4.224 9.856C4.408 10.067 4.598 10.285 4.628 10.398L5.568 13.889C5.744 14.543 6.34 14.999 7.017 14.999H8.984C9.662 14.999 10.257 14.542 10.432 13.889L11.372 10.397C11.402 10.285 11.593 10.067 11.776 9.856C12.363 9.183 13.25 8.167 13.25 6.25C13.25 3.355 10.895 1 8 1ZM9.467 13.63C9.408 13.848 9.209 14 8.984 14H7.017C6.791 14 6.593 13.848 6.534 13.63L6.095 12H9.906L9.467 13.63ZM11.022 9.199C10.741 9.522 10.497 9.802 10.407 10.137L10.175 10.999H5.826L5.594 10.138C5.503 9.801 5.26 9.522 4.977 9.199C4.43 8.572 3.75 7.792 3.75 6.25C3.75 3.59 5.911 2 8 2C10.344 2 12.25 3.907 12.25 6.25C12.25 7.792 11.569 8.572 11.022 9.199Z"/></svg>
);

const PluginIcon: React.FC = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M10.723 4H10V1.5C10 1.224 9.776 1 9.5 1C9.224 1 9 1.224 9 1.5V4H7V1.5C7 1.224 6.776 1 6.5 1C6.224 1 6 1.224 6 1.5V4H5.277C4.573 4 4 4.573 4 5.278V8C4 10.036 5.529 11.722 7.5 11.969V14.5C7.5 14.776 7.724 15 8 15C8.276 15 8.5 14.776 8.5 14.5V11.969C10.471 11.722 12 10.037 12 8V5.278C12 4.573 11.427 4 10.723 4ZM11 8C11 9.654 9.654 11 8 11C6.346 11 5 9.654 5 8V5.278C5 5.125 5.124 5 5.277 5H10.722C10.875 5 10.999 5.125 10.999 5.278V8H11Z"/></svg>
);



const McpIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="10 14 168 180" fill="none">
    <path d="M25 97.8528L92.8823 29.9706C102.255 20.598 117.451 20.598 126.823 29.9706V29.9706C136.196 39.3431 136.196 54.5391 126.823 63.9117L75.5581 115.177" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
    <path d="M76.2653 114.47L126.823 63.9117C136.196 54.5391 151.392 54.5391 160.765 63.9117L161.118 64.2652C170.491 73.6378 170.491 88.8338 161.118 98.2063L99.7248 159.6C96.6006 162.724 96.6006 167.789 99.7248 170.913L112.331 183.52" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
    <path d="M109.853 46.9411L59.6482 97.1457C50.2757 106.518 50.2757 121.714 59.6482 131.087V131.087C69.0208 140.459 84.2168 140.459 93.5894 131.087L143.794 80.8822" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
  </svg>
);

interface CategoryDef {
  label: string;
  kindValue?: string;
  icon?: React.ReactNode;
}

const categories: CategoryDef[] = [
  { label: 'All assets' },
  { label: 'APIs', kindValue: 'rest', icon: <PlugConnectedRegular /> },
  // { label: 'Agents', kindValue: 'agent', icon: <AgentIcon /> },
  { label: 'MCP servers', kindValue: 'mcp', icon: <McpIcon /> },
  // { label: 'Models', kindValue: 'languagemodel', icon: <BoxMultipleRegular /> },
  { label: 'Plugins', kindValue: 'plugin', icon: <PluginIcon /> },
  { label: 'Skills', kindValue: 'skill', icon: <SkillIcon /> },
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
