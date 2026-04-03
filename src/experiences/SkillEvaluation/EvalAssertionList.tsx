import React, { useState } from 'react';
import { Badge, Button } from '@fluentui/react-components';
import {
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
} from '@fluentui/react-icons';
import { EvalAssertion, EvalTierResult } from '@/types/skillEvaluation';
import styles from './SkillEvaluation.module.scss';

/** Static descriptions for known L0 / L1 assertion names. */
const ASSERTION_DESCRIPTIONS: Record<string, string> = {
  // L0 — Structural checks
  'frontmatter-present': 'Verifies that the SKILL.md file begins with a valid YAML frontmatter block.',
  'has-name': 'Checks that the frontmatter declares a skill name.',
  'has-description': 'Checks that the frontmatter includes a description field.',
  'body-not-empty': 'Ensures the SKILL.md body contains meaningful content beyond the frontmatter.',

  // L1 — Schema / pattern validation
  'has-instructions-section': 'Verifies that the skill file contains an explicit instructions section.',
  'has-examples-section': 'Checks for an examples section demonstrating usage patterns.',
  'has-error-handling-section': 'Checks for a section describing error handling and edge cases.',
};

interface EvalAssertionListProps {
  title: string;
  tier: EvalTierResult<EvalAssertion>;
}

export const EvalAssertionList: React.FC<EvalAssertionListProps> = ({ title, tier }) => {
  const [expanded, setExpanded] = useState(false);
  const assertions = tier.assertions ?? [];

  return (
    <div className={styles.assertionSection}>
      <div className={styles.assertionHeader}>
        <h4 className={styles.assertionTitle}>{title}</h4>
        <Badge
          appearance="tint"
          color={tier.status === 'pass' ? 'success' : 'danger'}
          shape="circular"
        >
          {tier.passed}/{tier.total} passed
        </Badge>
        {assertions.length > 0 && (
          <Button
            appearance="subtle"
            size="small"
            icon={expanded ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide' : 'Show'} details
          </Button>
        )}
      </div>

      {expanded && assertions.length > 0 && (
        <ul className={styles.assertionList}>
          {assertions.map((a) => {
            const description = ASSERTION_DESCRIPTIONS[a.name];
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
    </div>
  );
};

export default React.memo(EvalAssertionList);
