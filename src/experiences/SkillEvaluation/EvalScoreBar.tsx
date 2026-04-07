import React from 'react';
import { EvalJudgeScore } from '@/types/skillEvaluation';
import styles from './SkillEvaluation.module.scss';

interface EvalScoreBarProps {
  score: EvalJudgeScore;
}

function scoreColor(score: number, maxScore: number): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.8) return 'var(--colorPaletteGreenBackground3)';
  if (ratio >= 0.6) return 'var(--colorPaletteYellowBackground3)';
  return 'var(--colorPaletteRedBackground3)';
}

function formatLabel(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const EvalScoreBar: React.FC<EvalScoreBarProps> = ({ score }) => {
  const pct = score.maxScore > 0 ? (score.score / score.maxScore) * 100 : 0;
  const color = scoreColor(score.score, score.maxScore);

  return (
    <div className={styles.scoreBarItem}>
      <div className={styles.scoreBarHeader}>
        <span className={styles.scoreBarLabel}>{formatLabel(score.name)}</span>
        <span className={styles.scoreBarValue}>{score.score.toFixed(1)}</span>
      </div>
      <div className={styles.scoreBarTrack}>
        <div
          className={styles.scoreBarFill}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {score.reasoning && (
        <p className={styles.scoreBarReasoning}>{score.reasoning}</p>
      )}
    </div>
  );
};

export default React.memo(EvalScoreBar);
