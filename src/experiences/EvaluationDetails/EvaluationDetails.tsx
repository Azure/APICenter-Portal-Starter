import React, { useState } from 'react';
import { Badge, Spinner } from '@fluentui/react-components';
import { Warning20Filled } from '@fluentui/react-icons';
import { EvaluationResult, EvalJudgeScore, getEvalScore } from '@/types/evaluation';
import { EvalScoreBar } from './EvalScoreBar';
import { EvalAssertionList } from './EvalAssertionList';
import { EvalRadarChart } from './EvalRadarChart';
import styles from './EvaluationDetails.module.scss';

interface EvaluationDetailsProps {
  evalResult?: EvaluationResult;
  isLoading?: boolean;
  assertionDescriptions?: Record<string, string>;
}

/** Default threshold for passing (normalized to /5 scale). */
const THRESHOLD = 4.0;

/** Generate a brief AI-style summary based on tier results. */
function buildSummary(evalResult: EvaluationResult): string {
  const scores = evalResult.qualityAssessment.scores ?? [];
  const low = scores.filter(s => s.score < THRESHOLD);
  const high = scores.filter(s => s.score >= THRESHOLD);

  const parts: string[] = [];
  if (high.length > 0) {
    const names = high.map(s => s.name.replace(/[-_]/g, ' ')).join(', ');
    parts.push(`Performs well on ${names}.`);
  }
  if (low.length > 0) {
    const names = low.map(s => s.name.replace(/[-_]/g, ' ')).join(', ');
    parts.push(`Falls short on ${names}.`);
  }
  parts.push(`Recommended threshold is ${THRESHOLD.toFixed(1)}/5.`);
  return parts.join(' ');
}

/** Generate improvement recommendations from low-scoring criteria. */
function buildRecommendations(scores: EvalJudgeScore[]): Array<{ title: string; description: string; impact: 'high' | 'medium' }> {
  return scores
    .filter(s => s.score < THRESHOLD)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(s => ({
      title: `Improve ${s.name.replace(/[-_]/g, ' ')}`,
      description: s.reasoning,
      impact: s.score < 3 ? 'high' as const : 'medium' as const,
    }));
}

export const EvaluationDetails: React.FC<EvaluationDetailsProps> = ({
  evalResult,
  isLoading,
  assertionDescriptions,
}) => {
  const [highlightedCriterion, setHighlightedCriterion] = useState<string | null>(null);

  if (isLoading) {
    return <Spinner size="small" label="Loading assessment results..." labelPosition="below" />;
  }

  if (!evalResult) return null;

  const { overallScore, maxScore } = getEvalScore(evalResult);
  const normalized = maxScore > 0
    ? (overallScore / maxScore) * 5
    : 0;
  const ratio = maxScore > 0 ? overallScore / maxScore : 0;

  function headerBadgeColor(): 'success' | 'warning' | 'danger' {
    if (ratio >= 0.8) return 'success';
    if (ratio >= 0.6) return 'warning';
    return 'danger';
  }

  const scores = evalResult.qualityAssessment.scores ?? [];
  const belowThreshold = normalized < THRESHOLD;
  const recommendations = buildRecommendations(scores);

  return (
    <div className={styles.evalDetails}>
      {/* Overall header */}
      <div className={styles.evalHeader}>
        <Badge
          appearance="filled"
          color={headerBadgeColor()}
          shape="circular"
          size="large"
          className={styles.evalHeaderBadge}
        >
          {normalized.toFixed(1)} <span className={styles.scoreBadgeMax}>/5</span>
        </Badge>
        <h3 className={styles.evalHeaderTitle}>AI Quality Score</h3>
        {belowThreshold ? (
          <Badge appearance="filled" color="warning" shape="circular">
            <span className={styles.thresholdBadge}>
              <Warning20Filled />
              Below threshold
            </span>
          </Badge>
        ) : (
          <Badge appearance="filled" color="success" shape="circular">
            Passed
          </Badge>
        )}
      </div>

      {evalResult.updatedOn && (
        <p className={styles.evalUpdated}>
          Assessed on {new Date(evalResult.updatedOn).toLocaleDateString()}
        </p>
      )}

      {/* AI Summary */}
      <p className={styles.aiSummary}>
        {buildSummary(evalResult)}
      </p>

      {/* Quality assessment — criteria cards + radar chart */}
      {scores.length > 0 && (
        <div className={styles.evalSection}>
          <h4 className={styles.evalSectionTitle}>Assessment</h4>
          <div className={scores.length >= 3 ? styles.evalContentLayout : undefined}>
            <div className={styles.criteriaList}>
              {scores.map((s) => (
                <EvalScoreBar
                  key={s.name}
                  score={s}
                  isHighlighted={highlightedCriterion === s.name}
                  onHoverCriterion={setHighlightedCriterion}
                />
              ))}
            </div>
            {scores.length >= 3 && (
              <EvalRadarChart
                scores={scores}
                highlightedCriterion={highlightedCriterion}
                onHoverCriterion={setHighlightedCriterion}
              />
            )}
          </div>
        </div>
      )}

      {/* Top Improvements */}
      {recommendations.length > 0 && (
        <div className={styles.evalSection}>
          <h4 className={styles.evalSectionTitle}>💡 Top Improvements</h4>
          {recommendations.map((rec, i) => (
            <div key={i} className={styles.recCard}>
              <div className={`${styles.recSeverity} ${rec.impact === 'high' ? styles.recSeverityHigh : styles.recSeverityMedium}`} />
              <div className={styles.recContent}>
                <h4>
                  {rec.title}
                  <Badge
                    appearance="filled"
                    color={rec.impact === 'high' ? 'danger' : 'warning'}
                    shape="circular"
                    size="small"
                    style={{ marginLeft: 6, verticalAlign: 'middle' }}
                  >
                    {rec.impact === 'high' ? 'High Impact' : 'Medium'}
                  </Badge>
                </h4>
                <p>{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Structural checks */}
      <EvalAssertionList title="Structural Checks" tier={evalResult.structuralChecks} assertionDescriptions={assertionDescriptions} />

      {/* Schema validation */}
      <EvalAssertionList title="Schema Validation" tier={evalResult.schemaValidation} assertionDescriptions={assertionDescriptions} />
    </div>
  );
};

export default React.memo(EvaluationDetails);
