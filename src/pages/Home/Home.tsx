import React from 'react';
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
import styles from './Home.module.scss';

export const Home: React.FC = () => {
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);
  const isAccessDenied = useRecoilValue(isAccessDeniedAtom);

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
    </div>
  );
};

export default React.memo(Home);
