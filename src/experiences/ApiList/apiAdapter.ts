import { type ApiCardApi } from '@/components/ApiCard';
import { ApiMetadata } from '@/types/api';

/** Mock eval scores for prototype — remove when real data is available */
const MOCK_EVAL_SCORES: Record<string, { score: number; maxScore: number }> = {
  'appinsights-instrumentation': { score: 3.8, maxScore: 5 },
  'azure-functions-guidance': { score: 4.5, maxScore: 5 },
  'cosmos-db-patterns': { score: 2.8, maxScore: 5 },
  'api-versioning-best-practices': { score: 4.2, maxScore: 5 },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiAdapter(api: any): ApiCardApi & ApiMetadata {
  const summary = api.summary;
  const mockEval = MOCK_EVAL_SCORES[api.name];

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
