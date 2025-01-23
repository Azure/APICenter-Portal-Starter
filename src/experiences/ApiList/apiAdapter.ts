import { Api as DocsApi } from '@microsoft/api-docs-ui';
import { Api } from '@/contracts/api';

export default function apiAdapter(api: Api): DocsApi {
  return {
    name: api.name,
    displayName: api.title,
    description: api.description,
    type: api.kind,
  };
}
