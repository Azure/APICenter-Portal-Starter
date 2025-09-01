import React, { useCallback, useState } from 'react';
import { Dismiss16Regular, Info16Filled, Open16Filled } from '@fluentui/react-icons';
import { Button, Link } from '@fluentui/react-components';
import { useRecoilValue } from 'recoil';
import { LocalStorageService } from '@/services/LocalStorageService';
import { LocationsService } from '@/services/LocationsService';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import styles from './SemanticSearchInfo.module.scss';

interface Props {
  isSemanticSearchEnabled: boolean;
}

export const SemanticSearchInfo: React.FC<Props> = ({ isSemanticSearchEnabled }) => {
  const [infoDismissed, setInfoDismissed] = useState(
    LocalStorageService.get(LocalStorageService.StorageKeys.SEMANTIC_SEARCH_INFO_DISMISSED)
  );

  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  const handleInfoDismiss = useCallback(() => {
    setInfoDismissed(true);
    LocalStorageService.set(LocalStorageService.StorageKeys.SEMANTIC_SEARCH_INFO_DISMISSED, true);
  }, []);

  if (!isAuthenticated) {
    return;
  }

  function renderContent() {
    if (!infoDismissed) {
      return (
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
      );
    }

    if (isSemanticSearchEnabled) {
      return (
        <Link
          className={styles.infoLink}
          href={LocationsService.getAiSearchInfoUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Get more information about Search with AI</span>
          <Open16Filled />
        </Link>
      );
    }

    return null;
  }

  const content = renderContent();

  if (!content) {
    return null;
  }

  return <div className={styles.semanticSearchInfo}>{content}</div>;
};

export default React.memo(SemanticSearchInfo);
