/**
 * DEV-ONLY mock evaluation results for previewing the Assessment tab UI.
 * Remove this file when the backend returns real evaluation data.
 */
import { SkillEvaluationResult } from '@/types/skillEvaluation';

const MOCK_EVAL_RESULTS: Record<string, SkillEvaluationResult> = {
  'appinsights-instrumentation': {
    skillName: 'appinsights-instrumentation',
    status: 'fail',
    overallScore: 3.8,
    maxScore: 5,
    evaluationConfigurationName: 'default',
    updatedOn: '2026-04-15T10:30:00Z',
    structuralChecks: {
      status: 'pass',
      passed: 5,
      total: 5,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'frontmatter-present', status: 'pass', message: 'Valid YAML frontmatter found' },
        { name: 'has-name', status: 'pass', message: 'Skill name declared' },
        { name: 'has-description', status: 'pass', message: 'Description field present' },
        { name: 'body-not-empty', status: 'pass', message: 'Body contains meaningful content' },
        { name: 'has-functions', status: 'pass', message: 'At least one function defined' },
      ],
    },
    schemaValidation: {
      status: 'pass',
      passed: 4,
      total: 4,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'has-instructions-section', status: 'pass', message: 'Instructions section found' },
        { name: 'has-examples-section', status: 'pass', message: 'Examples section present' },
        { name: 'has-error-handling-section', status: 'pass', message: 'Error handling documented' },
        { name: 'valid-schema', status: 'pass', message: 'Schema validates correctly' },
      ],
    },
    qualityAssessment: {
      status: 'fail',
      passed: 3,
      total: 5,
      weightedScore: 3.8,
      maxWeightedScore: 5,
      scores: [
        { name: 'instruction-clarity', score: 4.2, maxScore: 5, passed: true, reasoning: 'Instructions are clear and well-structured with good examples.' },
        { name: 'help-completeness', score: 2.8, maxScore: 5, passed: false, reasoning: 'The guide relies heavily on linked files rather than inline content, and lacks end-to-end walkthroughs.' },
        { name: 'safety-guidance', score: 4.5, maxScore: 5, passed: true, reasoning: 'Good coverage of security practices and data sensitivity.' },
        { name: 'error-handling', score: 3.5, maxScore: 5, passed: false, reasoning: 'Basic error handling documented but missing common failure scenarios.' },
        { name: 'usage-examples', score: 4.0, maxScore: 5, passed: true, reasoning: 'Solid examples provided for common use cases.' },
      ],
    },
  },
  'azure-functions-guidance': {
    skillName: 'azure-functions-guidance',
    status: 'pass',
    overallScore: 4.5,
    maxScore: 5,
    evaluationConfigurationName: 'default',
    updatedOn: '2026-04-14T08:15:00Z',
    structuralChecks: {
      status: 'pass',
      passed: 5,
      total: 5,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'frontmatter-present', status: 'pass', message: 'Valid YAML frontmatter found' },
        { name: 'has-name', status: 'pass', message: 'Skill name declared' },
        { name: 'has-description', status: 'pass', message: 'Description field present' },
        { name: 'body-not-empty', status: 'pass', message: 'Body contains meaningful content' },
        { name: 'has-functions', status: 'pass', message: 'Functions well-defined' },
      ],
    },
    schemaValidation: {
      status: 'pass',
      passed: 4,
      total: 4,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'has-instructions-section', status: 'pass', message: 'Instructions section found' },
        { name: 'has-examples-section', status: 'pass', message: 'Examples section present' },
        { name: 'has-error-handling-section', status: 'pass', message: 'Error handling documented' },
        { name: 'valid-schema', status: 'pass', message: 'Schema validates correctly' },
      ],
    },
    qualityAssessment: {
      status: 'pass',
      passed: 5,
      total: 5,
      weightedScore: 4.5,
      maxWeightedScore: 5,
      scores: [
        { name: 'instruction-clarity', score: 4.8, maxScore: 5, passed: true, reasoning: 'Exceptionally clear step-by-step instructions.' },
        { name: 'help-completeness', score: 4.2, maxScore: 5, passed: true, reasoning: 'Comprehensive coverage including edge cases.' },
        { name: 'safety-guidance', score: 4.5, maxScore: 5, passed: true, reasoning: 'Thorough security and best practices guidance.' },
        { name: 'error-handling', score: 4.3, maxScore: 5, passed: true, reasoning: 'Detailed error handling for all common scenarios.' },
        { name: 'usage-examples', score: 4.7, maxScore: 5, passed: true, reasoning: 'Rich examples with real-world scenarios.' },
      ],
    },
  },
  'cosmos-db-patterns': {
    skillName: 'cosmos-db-patterns',
    status: 'fail',
    overallScore: 2.8,
    maxScore: 5,
    evaluationConfigurationName: 'default',
    updatedOn: '2026-04-13T14:45:00Z',
    structuralChecks: {
      status: 'pass',
      passed: 4,
      total: 5,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'frontmatter-present', status: 'pass', message: 'Valid YAML frontmatter found' },
        { name: 'has-name', status: 'pass', message: 'Skill name declared' },
        { name: 'has-description', status: 'pass', message: 'Description field present' },
        { name: 'body-not-empty', status: 'pass', message: 'Body contains meaningful content' },
        { name: 'has-functions', status: 'fail', message: 'No functions defined in skill manifest' },
      ],
    },
    schemaValidation: {
      status: 'fail',
      passed: 2,
      total: 4,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'has-instructions-section', status: 'pass', message: 'Instructions section found' },
        { name: 'has-examples-section', status: 'fail', message: 'No examples section found' },
        { name: 'has-error-handling-section', status: 'fail', message: 'Missing error handling section' },
        { name: 'valid-schema', status: 'pass', message: 'Schema validates correctly' },
      ],
    },
    qualityAssessment: {
      status: 'fail',
      passed: 1,
      total: 5,
      weightedScore: 2.8,
      maxWeightedScore: 5,
      scores: [
        { name: 'instruction-clarity', score: 3.2, maxScore: 5, passed: false, reasoning: 'Instructions lack detail and assume significant prior knowledge.' },
        { name: 'help-completeness', score: 2.0, maxScore: 5, passed: false, reasoning: 'Very incomplete — missing most common usage patterns.' },
        { name: 'safety-guidance', score: 3.5, maxScore: 5, passed: false, reasoning: 'Minimal security guidance for a data-focused skill.' },
        { name: 'error-handling', score: 2.3, maxScore: 5, passed: false, reasoning: 'Almost no error handling documentation.' },
        { name: 'usage-examples', score: 3.0, maxScore: 5, passed: false, reasoning: 'Only one basic example, no real-world scenarios.' },
      ],
    },
  },
};

export function getMockEvalResult(skillName: string): SkillEvaluationResult | undefined {
  return MOCK_EVAL_RESULTS[skillName];
}
