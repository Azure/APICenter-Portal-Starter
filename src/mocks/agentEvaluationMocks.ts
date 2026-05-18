/**
 * DEV-ONLY mock evaluation results for previewing the Agent Assessment tab UI
 * before the backend exposes real evaluation data.
 *
 * Mirrors the pattern in `skillEvaluationMocks.ts`. The fallback is gated behind
 * `import.meta.env.DEV` in `useAgentEvaluationResult` so this data NEVER ships
 * to production — it only fills in when running `npm start` locally and the
 * backend returns nothing for an agent's evaluation result.
 *
 * To add a preview entry, key it by `agentName` (matches the route param in
 * `/agents/:name`). Remove this file entirely once real evaluation data lands.
 */
import { AgentEvaluationResult } from '@/types/evaluation';

const MOCK_AGENT_EVAL_RESULTS: Record<string, AgentEvaluationResult> = {
  'support-triage-agent': {
    agentName: 'support-triage-agent',
    versionName: '1.0.0',
    status: 'pass',
    overallScore: 4.3,
    maxScore: 5,
    evaluationConfigurationName: 'default',
    updatedOn: '2026-05-10T09:00:00Z',
    structuralChecks: {
      status: 'pass',
      passed: 5,
      total: 5,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'manifest-present', status: 'pass', message: 'Agent manifest found' },
        { name: 'has-name', status: 'pass', message: 'Agent name declared' },
        { name: 'has-description', status: 'pass', message: 'Description field present' },
        { name: 'has-version', status: 'pass', message: 'Version declared' },
        { name: 'has-entrypoint', status: 'pass', message: 'Entrypoint defined' },
      ],
    },
    schemaValidation: {
      status: 'pass',
      passed: 4,
      total: 4,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'valid-schema', status: 'pass', message: 'Schema validates correctly' },
        { name: 'has-capabilities', status: 'pass', message: 'Capabilities declared' },
        { name: 'has-inputs', status: 'pass', message: 'Inputs defined' },
        { name: 'has-outputs', status: 'pass', message: 'Outputs defined' },
      ],
    },
    qualityAssessment: {
      status: 'pass',
      passed: 4,
      total: 5,
      weightedScore: 4.3,
      maxWeightedScore: 5,
      scores: [
        { name: 'instruction-clarity', score: 4.5, maxScore: 5, passed: true, reasoning: 'Agent instructions are well-structured and unambiguous.' },
        { name: 'capability-coverage', score: 4.2, maxScore: 5, passed: true, reasoning: 'Covers the main triage scenarios with appropriate fallbacks.' },
        { name: 'safety-guidance', score: 4.6, maxScore: 5, passed: true, reasoning: 'Clear escalation rules and PII handling guidance.' },
        { name: 'error-handling', score: 3.8, maxScore: 5, passed: false, reasoning: 'Handles common errors but missing retry guidance for transient failures.' },
        { name: 'usage-examples', score: 4.4, maxScore: 5, passed: true, reasoning: 'Solid worked examples spanning multiple ticket types.' },
      ],
    },
  },
};

export function getMockAgentEvalResult(agentName: string): AgentEvaluationResult | undefined {
  return MOCK_AGENT_EVAL_RESULTS[agentName];
}
