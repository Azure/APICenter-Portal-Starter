import { Api as DocsApi } from '@microsoft/api-docs-ui';
import { ApiMetadata } from '@/types/api';

export default function apiAdapter(api: ApiMetadata): DocsApi & ApiMetadata {
  return {
    ...api,
    name: api.name,
    displayName: api.title,
    description: api.summary,
    type: api.kind,
  };
}
