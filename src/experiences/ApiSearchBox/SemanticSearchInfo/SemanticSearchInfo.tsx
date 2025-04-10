import React, { useCallback, useState } from 'react';
import { Dismiss16Regular, Info16Filled } from '@fluentui/react-icons';
import { Button } from '@fluentui/react-components';
import LocalStorageService from '@/services/LocalStorageService';
import styles from './SemanticSearchInfo.module.scss';

export const SemanticSearchInfo: React.FC = () => {
  const [infoDismissed, setInfoDismissed] = useState(
    LocalStorageService.get(LocalStorageService.StorageKeys.SEMANTIC_SEARCH_INFO_DISMISSED)
  );

  const handleInfoDismiss = useCallback(() => {
    setInfoDismissed(true);
    LocalStorageService.set(LocalStorageService.StorageKeys.SEMANTIC_SEARCH_INFO_DISMISSED, true);
  }, []);

  if (infoDismissed) {
    return null;
  }

  return (
    <div className={styles.semanticSearchInfo}>
      <div className={styles.infoBlock}>
        <h6>
          <Info16Filled className={styles.icon} /> Search with the power of AI
        </h6>
        <Button
          className={styles.dismissBtn}
          appearance="transparent"
          icon={<Dismiss16Regular />}
          onClick={handleInfoDismiss}
        />
        <p>
          Search with AI assistance to quickly find what you need. Just describe what you want to do, and see the
          recommended APIs and tools.
        </p>
      </div>
    </div>
  );
};

export default React.memo(SemanticSearchInfo);
