import React from 'react';
import { Badge } from '@fluentui/react-components';
import { SkillEvaluationResult } from '@/types/skillEvaluation';
import styles from './SkillEvaluation.module.scss';

interface EvalScoreBadgeProps {
  evalResult?: SkillEvaluationResult;
}

type BadgeColor = 'success' | 'warning' | 'danger';

function scoreBadgeColor(ratio: number): BadgeColor {
  if (ratio >= 0.8) return 'success';
  if (ratio >= 0.6) return 'warning';
  return 'danger';
}

/** Compact score pill for the header metadata area. */
export const EvalScoreBadge: React.FC<EvalScoreBadgeProps> = ({ evalResult }) => {
  if (!evalResult || evalResult.maxScore <= 0) return null;

  const ratio = evalResult.overallScore / evalResult.maxScore;
  const normalized = ratio * 5;
  const display = normalized.toFixed(1);
  const color = scoreBadgeColor(ratio);

  return (
    <span className={styles.scoreBadge}>
      <Badge
        appearance="filled"
        color={color}
        shape="circular"
        className={styles.scoreBadgePill}
      >
        {display} <span className={styles.scoreBadgeMax}>/5</span>
      </Badge>
      <span className={styles.scoreBadgeLabel}>AI Quality Score</span>
    </span>
  );
};

export default React.memo(EvalScoreBadge);
