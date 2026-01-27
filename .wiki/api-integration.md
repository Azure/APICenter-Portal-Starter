# Azure API Center Integration

## Overview

**Purpose**: Connect to Azure API Center data plane API to fetch and display API catalog

**Base URL Pattern**: `https://{instanceName}.data.{region}.azure-apicenter.ms/workspaces/default`

**Authentication**: Bearer token (Azure AD) or anonymous (no token)

---

## API Center Concepts

### Workspace
- **Purpose**: Organizational unit for APIs
- **Current**: Hardcoded to `/workspaces/default`
- **TODO**: Multi-workspace support

### API Metadata
- **What**: High-level API information
- **Fields**: name, title, kind, description, summary, lifecycleStage, externalDocumentation, contacts, customProperties

### API Version
- **What**: API version (e.g., v1, v2, 2024-01-01)
- **Relationship**: API → multiple versions

### API Definition
- **What**: Machine-readable spec (OpenAPI, GraphQL, etc.)
- **Relationship**: Version → multiple definitions (e.g., JSON, YAML)
- **Spec Types**: OpenAPI v2/v3, GraphQL, gRPC, WSDL, AsyncAPI, MCP

### API Deployment
- **What**: Where API is deployed (environment, server, runtime URL)
- **Relationship**: API → multiple deployments

### Environment
- **What**: Deployment target (dev, staging, production)
- **Fields**: name, title, kind, server, customProperties

### Security Requirements
- **What**: Auth schemes required by API
- **Types**: OAuth 2.0, API Key, Basic, etc.

---

## Data Plane API Endpoints

### APIs

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/apis` | GET | List APIs | `{ value: ApiMetadata[] }` |
| `/apis?$search={query}` | GET | Text search | `{ value: ApiMetadata[] }` |
| `/:search` | POST | Semantic search | `{ value: ApiMetadata[] }` |
| `/apis/{apiName}` | GET | Get single API | `ApiMetadata` |
| `/apis?$filter={odata}` | GET | Filter APIs | `{ value: ApiMetadata[] }` |

**Search Body** (semantic):
```json
{
  "query": "authentication apis",
  "searchType": "vector"
}
```

**Filter Examples**:
```
kind eq 'rest'
(kind eq 'rest' or kind eq 'graphql') and (lifecycleStage eq 'production')
```

---

### Versions

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/apis/{apiName}/versions` | GET | List versions | `{ value: ApiVersion[] }` |

---

### Definitions

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/apis/{apiName}/versions/{versionName}/definitions` | GET | List definitions | `{ value: ApiDefinition[] }` |
| `/apis/{apiName}/versions/{versionName}/definitions/{definitionName}` | GET | Get definition | `ApiDefinition` |
| `/apis/{apiName}/versions/{versionName}/definitions/{definitionName}:exportSpecification` | POST | Get spec URL | `{ value: string }` |

**Spec Export**: Returns signed URL for downloading spec file

---

### Deployments

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/apis/{apiName}/deployments` | GET | List deployments | `{ value: ApiDeployment[] }` |

---

### Environments

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/environments/{environmentId}` | GET | Get environment | `ApiEnvironment` |

---

### Security

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/apis/{apiName}/versions/{versionName}/securityRequirements` | GET | List auth schemes | `{ value: ApiAuthSchemeMetadata[] }` |
| `/apis/{apiName}/versions/{versionName}/securitySchemes/{schemeName}` | GET | Get auth details | `ApiAuthScheme` |

---

### MCP Servers

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/v0/servers/{name}` | GET | Get MCP server | `Server` |

**Note**: `/v0/` prefix indicates preview API

---

## Request Patterns

### Authentication Header
```
Authorization: Bearer {token}
```

**Token Source**:
- Authenticated mode: MSAL `acquireTokenSilent()` or `acquireTokenRedirect()`
- Anonymous mode: No header

### Accept Header
```
Accept: application/json
```

### Content-Type (POST)
```
Content-Type: application/json
```

---

## Response Structures

### Collection Response
```typescript
{
  value: T[];           // Array of items
  nextLink?: string;    // Pagination (TODO: verify if used)
}
```

### Single Item Response
```typescript
{
  // Item properties directly in response
}
```

---

## Error Handling

### 401 Unauthorized
**Cause**: Invalid or expired token
**Portal Action**: Set `isAccessDeniedAtom`, show access denied page

### 403 Forbidden
**Cause**: Valid token but insufficient permissions
**Portal Action**: Set `isAccessDeniedAtom`, show access denied page

### 404 Not Found
**Cause**: Resource doesn't exist
**Portal Action**: Show "API not found" message

### 500 Internal Server Error
**Cause**: API Center service error
**Portal Action**: Show generic error message

---

## Caching Strategy

### HTTP GET Requests
**Method**: Memoized in `HttpService` via `memoizee`
**Duration**: Session lifetime (TODO: verify if configurable)
**Invalidation**: Page refresh

### Spec Files
**Method**: Memoized in `ApiService.getSpecification()`
**Duration**: Session lifetime
**Reason**: Large files, expensive to parse

### React Query
**Method**: Automatic caching with stale-while-revalidate
**Config**: Per-hook configuration (TODO: document defaults)

---

## API Center SKU Differences

### Free SKU
**Limit**: Maximum 5 APIs displayed
**Enforcement**: Portal-side limit (TODO: verify if backend enforces)

### Standard SKU
**Limit**: Unlimited APIs
**Detection**: Via capabilities flag? (TODO: verify)

---

## Special Features

### Semantic Search
**Requirement**: `semanticSearch` in `config.capabilities` array
**Endpoint**: `POST /:search` with `searchType: 'vector'`
**Backend**: Requires Azure AI Search integration (TODO: verify)

### Scoping Filter
**Config**: `config.scopingFilter` (OData filter string)
**Purpose**: Limit visible APIs by metadata
**Example**: `lifecycleStage eq 'production'`

---

## Data Transformation

### API List
1. Fetch raw `ApiMetadata[]` from `/apis`
2. Apply client-side filters (if semantic search not used)
3. Sort by user preference
4. Display in list or grid layout

### API Details
1. Fetch API metadata
2. Fetch versions, deployments in parallel
3. Combine into single view
4. Display in detail panel

### Spec Display
1. Fetch definition metadata
2. Call `:exportSpecification` to get signed URL
3. Fetch spec content from URL
4. Detect spec type (OpenAPI, GraphQL, etc.)
5. Parse with appropriate reader
6. Render with `@microsoft/api-docs-ui` or custom renderer

---

## API Center Configuration

### Portal Side (config.json)
```json
{
  "dataApiHostName": "instance.data.region.azure-apicenter.ms",
  "authentication": { ... },
  "scopingFilter": "lifecycleStage eq 'production'",
  "capabilities": ["semanticSearch"]
}
```

### Backend Side
- API Center instance name
- Region
- Workspace (default)
- RBAC permissions
- Semantic search enabled/disabled

---

## Integration Points

### Azure AD Authentication
**Scopes**: `https://azure-apicenter.net/Data.Read.All` (or custom)
**Tenant**: Multi-tenant or specific tenant
**Authority**: `https://login.microsoftonline.com/{tenantId}`

### API Management Gateway (Optional)
**Purpose**: Proxy data plane API for CORS, rate limiting
**Pattern**: APIM in front of API Center data plane
**TODO**: Verify if used in starter template

---

## TODO: API Center Questions

- [ ] Pagination support (nextLink usage)
- [ ] Rate limiting strategy
- [ ] Multi-workspace support
- [ ] SKU detection mechanism
- [ ] Semantic search backend requirements
- [ ] Custom metadata schema
- [ ] APIM gateway integration (if any)
- [ ] API versioning strategy (breaking changes)
- [ ] Webhook/notification support for API updates
