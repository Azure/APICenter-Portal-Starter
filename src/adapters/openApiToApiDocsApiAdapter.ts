import { Api as ApiDocsApi } from "api-docs-ui";

import { Api } from "../contracts/api.ts";

export default function openApiToApiDocsApiAdapter(api: Api): ApiDocsApi {
    return {
        name: api.name,
        displayName: api.title,
        description: api.description,
        type: api.kind,
    };
}
