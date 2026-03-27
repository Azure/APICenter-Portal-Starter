import { type ApiCardApi } from '@/components/ApiCard';
import { ApiMetadata } from '@/types/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiAdapter(api: any): ApiCardApi & ApiMetadata {
  const summary = api.summary;

  return {
    name: api.name,
    title: api.title || api.api,
    displayName: api.title || api.api,
    description: summary,
    type: api.kind,
    lifecycleStage: api.lifecycleStage,
  };
}
