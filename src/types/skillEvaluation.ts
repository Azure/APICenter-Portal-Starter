/** Response contract for `GET /workspaces/{ws}/skills/{name}/evaluationResults/{resultName}`. */
export interface SkillEvaluationResult {
  skillName: string;
  status: EvalStatus;
  overallScore: number;
  maxScore: number;
  evaluationConfigurationName: string;
  updatedOn: string;
  structuralChecks: EvalTierResult<EvalAssertion>;
  schemaValidation: EvalTierResult<EvalAssertion>;
  qualityAssessment: EvalTierResult<EvalJudgeScore>;
}

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
  message: string;
}

export interface EvalJudgeScore {
  name: string;
  score: number;
  maxScore: number;
  passed: boolean;
  reasoning: string;
}
