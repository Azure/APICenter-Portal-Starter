import React from 'react';
import styles from './VariationSwitcher.module.scss';

export type HomepageVariation = 'A' | 'B' | 'C';

interface VariationSwitcherProps {
  current: HomepageVariation;
  onChange: (variation: HomepageVariation) => void;
}

const variations: { key: HomepageVariation; label: string; description: string }[] = [
  { key: 'A', label: 'A: Foundry-style', description: 'Endpoints in hero, search below' },
  { key: 'B', label: 'B: Endpoint bar', description: 'Expandable bar between hero and content' },
  { key: 'C', label: 'C: Inline', description: 'Endpoint below search in hero' },
];

export const VariationSwitcher: React.FC<VariationSwitcherProps> = ({ current, onChange }) => {
  return (
    <div className={styles.switcher}>
      <span className={styles.label}>Homepage variation:</span>
      <div className={styles.buttons}>
        {variations.map(v => (
          <button
            key={v.key}
            className={`${styles.btn} ${current === v.key ? styles.active : ''}`}
            onClick={() => onChange(v.key)}
            title={v.description}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default React.memo(VariationSwitcher);
