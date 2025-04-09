import React, { useCallback } from 'react';
import classNames from 'classnames';
import { Dismiss12Regular } from '@fluentui/react-icons';
import { Button } from '@fluentui/react-components';
import SemanticSearchSvg from '@/assets/semanticSearch.svg';
import styles from './SemanticSearchToggle.module.scss';

interface Props {
  isEnabled?: boolean;
  onDisable?: () => void;
}

export const SemanticSearchToggle: React.FC<Props> = ({ isEnabled, onDisable }) => {
  const handleMouseDown = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
  }, []);

  return (
    <span
      className={classNames(styles.semanticSearchToggle, isEnabled && styles.isEnabled)}
      onMouseDown={handleMouseDown}
    >
      <span className={styles.icon}>
        <img src={SemanticSearchSvg} alt="Semantic search" />
      </span>
      <span>Search with AI</span>
      {isEnabled && !!onDisable && (
        <Button
          className={styles.disableBtn}
          appearance="transparent"
          aria-label="Turn off semantic search"
          icon={<Dismiss12Regular />}
          onClick={onDisable}
        />
      )}
    </span>
  );
};

export default React.memo(SemanticSearchToggle);
