import { type ApiCardApi } from '@/components/ApiCard';
import { ApiMetadata } from '@/types/api';

/**
 * PROTOTYPE MOCK SCORES — Remove when list API includes evaluation data.
 *
 * The skills list endpoint does not return assessment scores today.
 * These mock values demonstrate the homepage badge design for review.
 * Long-term: ask backend to include evaluationSummary in list response.
 */
const PROTOTYPE_MOCK_SCORES: Record<string, { score: number; maxScore: number }> = {
  'appinsights-instrumentation': { score: 3.8, maxScore: 5 },
  'azure-functions-guidance': { score: 4.5, maxScore: 5 },
  'cosmos-db-patterns': { score: 2.8, maxScore: 5 },
  'api-versioning-best-practices': { score: 4.2, maxScore: 5 },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiAdapter(api: any): ApiCardApi & ApiMetadata {
  const summary = api.summary;
  const mockEval = PROTOTYPE_MOCK_SCORES[api.name];

  return {
    name: api.name,
    title: api.title || api.api,
    displayName: api.title || api.api,
    description: summary,
    type: api.kind,
    lifecycleStage: api.lifecycleStage,
    ...(mockEval && { evalScore: mockEval.score, evalMaxScore: mockEval.maxScore }),
  };
}
