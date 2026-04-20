import React from 'react';
import { EvalJudgeScore } from '@/types/skillEvaluation';
import styles from './SkillEvaluation.module.scss';

interface EvalScoreBarProps {
  score: EvalJudgeScore;
  isHighlighted?: boolean;
  onHoverCriterion?: (name: string | null) => void;
}

const THRESHOLD = 4.0;

function formatLabel(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const EvalScoreBar: React.FC<EvalScoreBarProps> = ({ score, isHighlighted, onHoverCriterion }) => {
  const pct = score.maxScore > 0 ? (score.score / score.maxScore) * 100 : 0;
  const isPassing = score.score >= THRESHOLD;

  return (
    <div
      className={`${styles.criterionCard} ${isHighlighted ? styles.criterionHighlighted : ''}`}
      onMouseEnter={() => onHoverCriterion?.(score.name)}
      onMouseLeave={() => onHoverCriterion?.(null)}
    >
      <div className={styles.criterionCardHeader}>
        <span className={styles.criterionName}>{formatLabel(score.name)}</span>
        <span className={`${styles.criterionScore} ${isPassing ? styles.criterionScorePass : styles.criterionScoreFail}`}>
          {score.score.toFixed(1)}
        </span>
      </div>
      <div className={styles.criterionBarTrack}>
        <div
          className={`${styles.criterionBarFill} ${isPassing ? styles.criterionBarFillPass : styles.criterionBarFillFail}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {score.reasoning && (
        <p className={styles.criterionReasoning}>{score.reasoning}</p>
      )}
    </div>
  );
};

export default React.memo(EvalScoreBar);
