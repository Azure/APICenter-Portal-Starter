/** Shared evaluation result types for skill and agent assessments. */

export type EvalStatus = 'pass' | 'fail';

export interface EvalTierResult<T = unknown> {
  status: EvalStatus;
  passed: number;
  total: number;
  weightedScore: number | null;
  maxWeightedScore: number | null;
  /** Present on structuralChecks / schemaValidation tiers. */
  assertions?: T[];
  /** Present on qualityAssessment tier. */
  scores?: T[];
}

export interface EvalAssertion {
  name: string;
  status: EvalStatus;
  message?: string;
}

export interface EvalJudgeScore {
  name: string;
  score: number;
  maxScore: number;
  passed: boolean;
  reasoning: string;
}

/** Base evaluation result shared by skill and agent assessments. */
export interface EvaluationResult {
  status: EvalStatus;
  overallScore: number;
  maxScore: number;
  evaluationConfigurationName: string;
  updatedOn: string;
  structuralChecks: EvalTierResult<EvalAssertion>;
  schemaValidation: EvalTierResult<EvalAssertion>;
  qualityAssessment: EvalTierResult<EvalJudgeScore>;
}

/**
 * Resolve the effective overall score from an evaluation result.
 * Uses top-level fields when present, falls back to qualityAssessment tier scores.
 */
export function getEvalScore(r: EvaluationResult): { overallScore: number; maxScore: number } {
  const overallScore = r.overallScore ?? r.qualityAssessment.weightedScore ?? 0;
  const maxScore = r.maxScore ?? r.qualityAssessment.maxWeightedScore ?? 0;
  return { overallScore, maxScore };
}

/** Skill-specific evaluation result. */
export interface SkillEvaluationResult extends EvaluationResult {
  skillName: string;
}

/** Agent-specific evaluation result (version-scoped). */
export interface AgentEvaluationResult extends EvaluationResult {
  agentName: string;
  versionName: string;
}
