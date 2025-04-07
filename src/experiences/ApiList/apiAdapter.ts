import { Api as DocsApi } from '@microsoft/api-docs-ui';
import { ApiMetadata } from '@/types/api';

export default function apiAdapter(api: any): DocsApi & ApiMetadata {
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