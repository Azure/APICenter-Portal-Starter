import React from 'react';
import {
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  ChevronRight20Regular,
} from '@fluentui/react-icons';
import { EvalAssertion, EvalTierResult } from '@/types/evaluation';
import styles from './EvaluationDetails.module.scss';

interface EvalAssertionListProps {
  title: string;
  tier: EvalTierResult<EvalAssertion>;
  assertionDescriptions?: Record<string, string>;
}

export const EvalAssertionList: React.FC<EvalAssertionListProps> = ({ title, tier, assertionDescriptions }) => {
  const assertions = tier.assertions ?? [];

  return (
    <details className={styles.assertionSection}>
      <summary>
        <span className={styles.assertionChevron}>
          <ChevronRight20Regular />
        </span>
        <h4 className={styles.assertionTitle}>{title}</h4>
        <span className={`${styles.assertionCount} ${tier.status === 'pass' ? styles.assertionCountPass : styles.assertionCountFail}`}>
          {tier.passed}/{tier.total} passed
        </span>
      </summary>

      {assertions.length > 0 && (
        <ul className={styles.assertionList}>
          {assertions.map((a) => {
            const description = assertionDescriptions?.[a.name];
            return (
              <li key={a.name} className={styles.assertionItem}>
                {a.status === 'pass' ? (
                  <CheckmarkCircle20Regular className={styles.assertionIconPass} />
                ) : (
                  <DismissCircle20Regular className={styles.assertionIconFail} />
                )}
                <div>
                  <span className={styles.assertionName}>{a.name}</span>
                  {a.message && <span className={styles.assertionMessage}> — {a.message}</span>}
                  {description && <p className={styles.assertionDescription}>{description}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
};

export default React.memo(EvalAssertionList);
