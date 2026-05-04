import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import ApiList from '@/experiences/ApiList';
import AccessDeniedSvg from '@/assets/accessDenied.svg';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { isAccessDeniedAtom } from '@/atoms/isAccessDeniedAtom';
import ApiSearchBox from '@/experiences/ApiSearchBox';
import CategoryPills from '@/experiences/CategoryPills';
import AddFilterDropdown from '@/experiences/AddFilterDropdown';
import ApiListLayoutSwitch from '@/experiences/ApiListLayoutSwitch';
import ApiListSortingSelect from '@/experiences/ApiListSortingSelect';
import { ActiveFiltersBadges } from '@/experiences/ActiveFiltersBadges/ActiveFiltersBadges';
import { setDocumentTitle } from '@/utils/dom';
import { EndpointBar } from '@/components/EndpointBar';
import { ConnectBar } from '@/components/ConnectBar';
import styles from './Home.module.scss';

type HomepageVariation = 'v1' | 'v2';

const VariationToggle: React.FC<{ current: HomepageVariation; onChange: (v: HomepageVariation) => void }> = ({ current, onChange }) => (
  <div className={styles.variationToggle}>
    <span className={styles.variationLabel}>Variation:</span>
    <button className={`${styles.varBtn} ${current === 'v1' ? styles.active : ''}`} onClick={() => onChange('v1')}>
      v1: Detailed
    </button>
    <button className={`${styles.varBtn} ${current === 'v2' ? styles.active : ''}`} onClick={() => onChange('v2')}>
      v2: Simplified
    </button>
  </div>
);

export const Home: React.FC = () => {
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);
  const isAccessDenied = useRecoilValue(isAccessDeniedAtom);
  const [variation, setVariation] = useState<HomepageVariation>('v2');

  setDocumentTitle('API portal (preview)');

  function renderApiList() {
    if (!isAuthenticated) {
      return (
        <div className={styles.emptyState}>
          <img src={AccessDeniedSvg} alt="Sign in required" />
          Sign in or create an account to view APIs.
        </div>
      );
    }

    if (isAccessDenied) {
      return (
        <div className={styles.emptyState}>
          <img src={AccessDeniedSvg} alt="Access Denied" />
          You don&#39;t have permission to access this developer portal. Please contact this developer portal&#39;s
          administrator for assistance.
        </div>
      );
    }

    return <ApiList />;
  }

  return (
    <div className={styles.home}>
      <div className={styles.searchPanel}>
        <h1>API Center portal</h1>

        <div className={styles.searchRow}>
          <ApiSearchBox />
          <ApiListSortingSelect />
          <AddFilterDropdown />
        </div>
      </div>

      <div className={styles.endpointBarWrapper}>
        {variation === 'v1' && (
          <EndpointBar serviceName="<your-service-name>" region="<region>" />
        )}
        {variation === 'v2' && (
          <ConnectBar serviceName="<your-service-name>" region="<region>" />
        )}
      </div>

      <section className={styles.content}>
        <div className={styles.pillsRow}>
          <CategoryPills />
          <ApiListLayoutSwitch />
        </div>

        <div className={styles.mainContent}>
          <ActiveFiltersBadges className={styles.activeFilters} />
          <div className={styles.results}>{renderApiList()}</div>
        </div>
      </section>

      <VariationToggle current={variation} onChange={setVariation} />
    </div>
  );
};

export default React.memo(Home);
