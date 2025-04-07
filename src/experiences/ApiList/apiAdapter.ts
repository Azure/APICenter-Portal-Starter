import { Api as DocsApi } from '@microsoft/api-docs-ui';
import { ApiMetadata } from '@/types/api';

export default function apiAdapter(api: any): DocsApi {
  const summary = api.summary;

  return {
    name: api.name,
    displayName: api.title || api.api,
    description: summary,
    type: api.kind,
  };
}