import React from 'react';
import { Badge, Spinner } from '@fluentui/react-components';
import { SkillEvaluationResult } from '@/types/skillEvaluation';
import { EvalScoreBar } from './EvalScoreBar';
import { EvalAssertionList } from './EvalAssertionList';
import { EvalRadarChart } from './EvalRadarChart';
import styles from './SkillEvaluation.module.scss';

interface SkillEvaluationDetailsProps {
  evalResult?: SkillEvaluationResult;
  isLoading?: boolean;
}

export const SkillEvaluationDetails: React.FC<SkillEvaluationDetailsProps> = ({
  evalResult,
  isLoading,
}) => {
  if (isLoading) {
    return <Spinner size="small" label="Loading evaluation results..." labelPosition="below" />;
  }

  if (!evalResult) return null;

  const normalized = evalResult.maxScore > 0
    ? (evalResult.overallScore / evalResult.maxScore) * 5
    : 0;
  const ratio = evalResult.maxScore > 0 ? evalResult.overallScore / evalResult.maxScore : 0;

  function headerBadgeColor(): 'success' | 'warning' | 'danger' {
    if (ratio >= 0.8) return 'success';
    if (ratio >= 0.6) return 'warning';
    return 'danger';
  }

  const scores = evalResult.qualityAssessment.scores ?? [];

  return (
    <div className={styles.evalDetails}>
      {/* Overall header */}
      <div className={styles.evalHeader}>
        <Badge
          appearance="filled"
          color={headerBadgeColor()}
          shape="circular"
          className={styles.evalHeaderBadge}
        >
          {normalized.toFixed(1)} <span className={styles.scoreBadgeMax}>/5</span>
        </Badge>
        <h3 className={styles.evalHeaderTitle}>AI Quality Score</h3>
        <Badge
          appearance="tint"
          color={evalResult.status === 'pass' ? 'success' : 'danger'}
          shape="circular"
        >
          {evalResult.status === 'pass' ? 'Passed' : 'Failed'}
        </Badge>
      </div>

      {evalResult.updatedOn && (
        <p className={styles.evalUpdated}>
          Evaluated on {new Date(evalResult.updatedOn).toLocaleDateString()}
        </p>
      )}

      {/* Quality assessment scores + radar chart */}
      {scores.length > 0 && (
        <div className={styles.evalSection}>
          <h4 className={styles.evalSectionTitle}>Evaluation</h4>
          <div className={styles.evalContentLayout}>
            <div className={styles.scoreBarList}>
              {scores.map((s) => (
                <EvalScoreBar key={s.name} score={s} />
              ))}
            </div>
            <div className={styles.radarContainer}>
              <EvalRadarChart scores={scores} />
            </div>
          </div>
        </div>
      )}

      {/* Structural checks */}
      <EvalAssertionList title="Structural Checks" tier={evalResult.structuralChecks} />

      {/* Schema validation */}
      <EvalAssertionList title="Schema Validation" tier={evalResult.schemaValidation} />
    </div>
  );
};

export default React.memo(SkillEvaluationDetails);
