# Data Flow

## Overview

This document traces the complete data flow from user interaction through state updates, service calls, HTTP requests, and API responses. Understanding these flows is critical for debugging and extending functionality.

---

## Primary Data Flows

### 1. Application Initialization Flow

```
User Opens App
  ↓
RootProvider renders
  ↓
Recoil initializes atoms/selectors
  ↓
configAtom effect fetches /config.json (async)
  ↓
appServicesAtom selector computes services from config
  ├─ If config.authentication exists → MsalAuthService
  └─ If no config.authentication → AnonymousAuthService
  ↓
isAuthenticatedAtom effect starts
  ├─ Retry loop waits for AuthService
  └─ Calls AuthService.isAuthenticated()
  ↓
Layout renders with initialized services
  ↓
HomePage/ApisPage renders with API data fetching
```

**Critical Timing**: `configAtom` must resolve before `appServicesAtom` is usable. `isAuthenticatedAtom` must wait for `appServicesAtom` via retry loop.

---

### 2. API List Fetch Flow

**Trigger**: User navigates to `/apis` (ApisPage)

```
ApisPage component renders
  ↓
useApis() hook invoked
  ↓
useApiService() returns ApiService from appServicesAtom
  ↓
useQuery('apis', ApiService.getApis) from React Query
  ↓
ApiService.getApis() method called
  ↓
HttpService.get('/apis', { useAuth: true })
  ↓
AuthService.getToken() (if authenticated mode)
  ├─ MSAL: acquireTokenSilent() → sessionStorage
  └─ Anonymous: Promise.resolve(null)
  ↓
fetch(url, { headers: { Authorization: Bearer <token> }})
  ↓
API Center Data Plane responds with { value: IApi[] }
  ↓
HttpService returns response.data
  ↓
React Query caches result (staleTime: 5min)
  ↓
useApis() returns { data: IApi[], isLoading, error }
  ↓
ApisPage receives data and renders <ApiList apis={data} />
```

**Caching**: React Query caches by query key `['apis']`. Subsequent navigations to `/apis` return cached data (no refetch until stale).

---

### 3. API Detail Fetch Flow

**Trigger**: User navigates to `/apis/:apiName` (ApiDetailsPage)

```
ApiDetailsPage renders with :apiName param
  ↓
useApi(apiName) hook invoked
  ↓
useQuery(['api', apiName], () => ApiService.getApi(apiName))
  ↓
ApiService.getApi(apiName)
  ↓
HttpService.get(/apis/{apiName})
  ↓
[AuthService.getToken() → fetch() → response]
  ↓
React Query caches { data: IApi }
  ↓
ApiDetailsPage receives IApi and renders details
```

**Cache Key**: `['api', apiName]` — unique per API.

---

### 4. API Spec Fetch Flow (with URL Resolution)

**Trigger**: User selects definition in ApiDetailsPage → spec viewer renders

```
User selects definition
  ↓
useApiSpecUrl(apiName, version, definition) hook
  ↓
useApiDefinition(apiName, version, definition) fetches definition metadata
  ↓
ApiService.getApiDefinition(apiName, version, definition)
  ↓
HttpService.get(/apis/{apiName}/versions/{version}/definitions/{definition})
  ↓
Response: { specification: { name, value } }
  where value = signed URL or inline spec
  ↓
React Query caches definition
  ↓
useApiSpecUrl resolves spec URL:
  ├─ If value starts with http → return value (signed URL)
  └─ Else → resolve via ApiService.getApiSpecContent(inline spec)
  ↓
useApiSpec(specUrl) hook fetches spec content
  ↓
fetch(specUrl) (no auth if signed URL, with auth if inline)
  ↓
Response: OpenAPI/AsyncAPI/gRPC spec JSON/YAML
  ↓
SpecReaderFactory.createReader(spec) parses spec
  ↓
Reader extracts operations, schemas, servers
  ↓
Spec viewer renders operations list
```

**Caching**: Definition metadata cached by React Query. Spec content cached by `memoizee` in spec readers (TTL: 10min).

---

### 5. Semantic Search Flow

**Trigger**: User enables semantic search toggle and types query

```
User toggles semantic search ON
  ↓
isSemanticSearchEnabledAtom set to true
  ↓
User types in ApiSearchBox
  ↓
useApis({ query: 'search term', semantic: true })
  ↓
ApiService.searchApis(query, semantic: true)
  ↓
HttpService.post('/:search', { body: { query, useSemanticSearch: true }})
  ↓
API Center semantic search (requires Azure AI Search backend)
  ↓
Response: { value: IApi[] } with relevance ranking
  ↓
React Query caches with key ['apis', { query, semantic }]
  ↓
ApiSearchBox shows results ranked by semantic similarity
```

**Fallback**: If semantic search fails (SKU limitation, backend not configured) → fallback to text search (`semantic: false`).

---

### 6. HTTP Test Console Flow

**Trigger**: User fills test console form and clicks "Send"

```
User selects operation → form pre-fills from spec
  ↓
User fills parameters, headers, body
  ↓
User clicks "Send" button
  ↓
HttpTestConsole component compiles request
  ├─ Resolves URL from deployment server URL + operation path
  ├─ Interpolates path params: /pets/{petId} → /pets/123
  ├─ Adds query params: ?limit=10&offset=0
  ├─ Merges headers (user + spec defaults)
  └─ Attaches body (JSON/FormData/Text)
  ↓
fetch(url, { method, headers, body }) (direct, no HttpService)
  ↓
Target API responds (external API, not API Center)
  ↓
Response captured: { status, headers, body }
  ↓
TestConsole renders response:
  ├─ Status code with color (green 2xx, red 4xx/5xx)
  ├─ Headers table
  └─ Body (JSON pretty-printed, or raw text)
```

**Key Detail**: Test console calls **target API** (via deployment server URL), not API Center. No authentication unless user adds `Authorization` header manually.

---

### 7. Authentication Flow (MSAL Mode)

**Trigger**: User clicks "Sign In" button

```
User clicks "Sign In"
  ↓
MsalAuthService.signIn() invoked
  ↓
MSAL.loginRedirect({ scopes: ['{apiCenterDataPlane}/.default'] })
  ↓
User redirected to Azure AD login page
  ↓
User authenticates with Microsoft account
  ↓
Azure AD redirects back with authorization code
  ↓
MSAL handles redirect and acquires token
  ↓
Token stored in sessionStorage by MSAL
  ↓
isAuthenticatedAtom effect detects change
  ↓
isAuthenticatedAtom set to true
  ↓
Header re-renders:
  ├─ "Sign In" button hidden
  └─ User profile/avatar shown (if implemented)
  ↓
Subsequent API calls include Bearer token
```

**Silent Refresh**: MSAL automatically refreshes token silently before expiration (acquireTokenSilent). If silent refresh fails → interactive redirect triggered.

---

### 8. Filter State Flow

**Trigger**: User selects filter in ApiFilters component

```
User selects "Lifecycle: Production" filter
  ↓
ApiFilters component calls setRecoilState(apiSearchFiltersAtom)
  ↓
apiSearchFiltersAtom updated: { lifecycle: ['production'] }
  ↓
useApis() hook subscribes to apiSearchFiltersAtom
  ↓
useApis() recomputes query key: ['apis', { filters: {...} }]
  ↓
React Query refetches with new key (cache miss)
  ↓
ApiService.getApis({ filters: { lifecycle: 'production' }})
  ↓
HttpService.get('/apis?$filter=lifecycle eq "production"')
  ↓
API Center responds with filtered APIs
  ↓
ApisPage re-renders with filtered list
```

**Cache Strategy**: Each filter combination = unique query key → separate cache entry.

---

### 9. Error Handling Flow

**Trigger**: API request fails (network error, 401, 403, 500)

```
fetch() throws error or returns non-2xx status
  ↓
HttpService catches error
  ├─ If 401 or 403 → set isAccessDeniedAtom to true
  └─ Else → throw error to React Query
  ↓
React Query sets { error, isError: true }
  ↓
Component receives error object from useQuery
  ↓
Component renders error state:
  ├─ If isAccessDenied → <EmptyStateMessage icon="accessDenied" />
  └─ Else → <ErrorMessage />
```

**Access Denied State**: Global `isAccessDeniedAtom` prevents repeated 401/403 error messages across multiple components.

---

## Data Transformation Patterns

### 1. API Response Normalization

**Location**: `ApiService` methods

**Pattern**: API Center returns `{ value: T[] }` collections → extract `.value` array.

```typescript
async getApis(): Promise<IApi[]> {
  const response = await this.http.get<{ value: IApi[] }>('/apis');
  return response.value; // Extract array from envelope
}
```

### 2. Spec URL Resolution

**Location**: `useApiSpecUrl` hook

**Pattern**: Definition `value` may be signed URL or inline spec → normalize to URL.

```typescript
if (definition.specification.value.startsWith('http')) {
  return definition.specification.value; // Signed URL
} else {
  // Inline spec → upload to blob or return data URL
  return await ApiService.getApiSpecContent(definition);
}
```

### 3. Memoization (Service Layer)

**Location**: `ApiService` methods with `memoizee`

**Pattern**: Cache expensive operations (spec parsing, definition fetching).

```typescript
const getApiDefinition = memoizee(
  async (name, version, def) => { /* fetch */ },
  { maxAge: 600000, promise: true } // 10min TTL
);
```

---

## State Update Sequences

### 1. Filter Selection → API Refetch

```
User action (filter select)
  → apiSearchFiltersAtom updated (Recoil)
  → useApis() hook recomputes query key (React Query)
  → Cache miss → ApiService.getApis() called
  → HTTP request → Response
  → React Query updates cache
  → Component re-renders with new data
```

### 2. Operation Selection → Spec Fetch

```
User clicks operation
  → setSearchParams({ operation: opId })
  → URL updates (?operation=opId)
  → useSearchParams() returns new value
  → useEffect detects change
  → useApiSpec(operation) hook invoked
  → React Query fetches spec if not cached
  → SpecReader parses operation
  → TestConsole renders with pre-filled form
```

---

## TODO: Data Flow

- [ ] Verify error telemetry flow (if implemented)
- [ ] Document retry logic for failed requests (React Query retries?)
- [ ] Verify pagination implementation (nextLink handling)
- [ ] Document optimistic updates (if any, e.g., recent searches)
- [ ] Verify background refetch strategy (React Query refetchOnWindowFocus?)
- [ ] Document WebSocket/SSE flow for MCP streaming (if implemented)
- [ ] Verify API Center workspace switching flow (multi-workspace support?)
- [ ] Document cache invalidation triggers (manual refetch buttons?)
- [ ] Verify if filters trigger debounced search (avoid excessive requests)
- [ ] Document analytics event flow (if tracking user actions)
