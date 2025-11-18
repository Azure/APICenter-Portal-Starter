# Service Layer Architecture

## Service Overview

**Purpose**: Abstract external API communication, authentication, and browser APIs

**Location**: `src/services/`

**Pattern**: Interface → Implementation → Registration

---

## Core Services

### 1. ApiService

**File**: `src/services/ApiService.ts`
**Interface**: `IApiService`
**Purpose**: Azure API Center data plane client

#### Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `getApis(search, filters, isSemanticSearch)` | List APIs | `ApiMetadata[]` |
| `getApi(name)` | Single API | `ApiMetadata` |
| `getServer(name)` | MCP server | `Server` |
| `getVersions(apiName)` | API versions | `ApiVersion[]` |
| `getDeployments(apiName)` | API deployments | `ApiDeployment[]` |
| `getDefinitions(apiName, version)` | API definitions | `ApiDefinition[]` |
| `getDefinition(definitionId)` | Single definition | `ApiDefinition` |
| `getSpecificationLink(definitionId)` | Spec download URL | `string` |
| `getSpecification(definitionId)` | Spec content (memoized) | `string` |
| `getEnvironment(environmentId)` | Deployment environment | `ApiEnvironment` |
| `getSecurityRequirements(definitionId)` | Auth schemes | `ApiAuthSchemeMetadata[]` |
| `getSecurityCredentials(definitionId, schemeName)` | Auth credentials | `ApiAuthScheme` |

#### Key Features

**Search**:
- Text search: `$search` query param
- Semantic search: `POST :search` with `{ query, searchType: 'vector' }`

**Filtering**:
- Builds OData filter strings: `(kind eq 'rest' or kind eq 'graphql') and (lifecycleStage eq 'production')`

**Caching**:
- `getSpecification` memoized (expensive spec fetch)

**Implementation**:
```typescript
export const ApiService: IApiService = {
  async getApis(search, filters, isSemanticSearch) {
    // Build query params
    if (isSemanticSearch) {
      return HttpService.post(':search', { query: search, searchType: 'vector' });
    }
    return HttpService.get(`/apis?${searchParams}`);
  },
  // ... other methods
};
```

---

### 2. HttpService

**File**: `src/services/HttpService.ts`
**Purpose**: Generic HTTP client with auth injection and error handling

#### Methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `get<T>(endpoint)` | `Promise<T>` | GET request (memoized) |
| `post<T>(endpoint, payload)` | `Promise<T>` | POST request |

#### Key Features

**Auth Injection**:
```typescript
const { AuthService } = getRecoil(appServicesAtom);
const token = await AuthService.getAccessToken();
if (token) {
  headers.append('Authorization', 'Bearer ' + token);
}
```

**Base URL Construction**:
```typescript
const config = getRecoil(configAtom);
let baseUrl = `https://${config.dataApiHostName}`;
if (!config.dataApiHostName.includes('/workspaces/default')) {
  baseUrl += '/workspaces/default';
}
const url = `${baseUrl}${endpoint}`;
```

**Error Handling**:
```typescript
if (response.status === 401 || response.status === 403) {
  if (accessToken) {
    setRecoil(isAccessDeniedAtom, true);
  }
}
```

**Caching**:
```typescript
const makeRequestWithCache = memoizee(makeRequest);
// GET requests memoized, POST not cached
```

---

### 3. MsalAuthService

**File**: `src/services/MsalAuthService.ts`
**Interface**: `IAuthService`
**Purpose**: Azure AD authentication via MSAL

#### Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `isAuthenticated()` | Check auth state | `Promise<boolean>` |
| `getAccessToken()` | Get token (silent or interactive) | `Promise<string>` |
| `signIn()` | Redirect to Azure AD | `Promise<void>` |
| `signOut()` | Sign out and redirect | `Promise<void>` |

#### MSAL Configuration

**Scopes**: From `config.authentication.scopes`
**Authority**: From `config.authentication.authority` (e.g., `https://login.microsoftonline.com/`)
**Client ID**: From `config.authentication.clientId`
**Tenant ID**: From `config.authentication.tenantId`

#### Token Acquisition Flow
1. Try `acquireTokenSilent()` (from cache or refresh token)
2. If fails, fall back to `acquireTokenRedirect()` (interactive)

---

### 4. AnonymousAuthService

**File**: `src/services/AnonymousAuthService.ts`
**Interface**: `IAuthService`
**Purpose**: No-op auth for anonymous access mode

#### Methods

| Method | Implementation |
|--------|----------------|
| `isAuthenticated()` | Returns `Promise.resolve(true)` |
| `getAccessToken()` | Returns `Promise.resolve('')` |
| `signIn()` | No-op |
| `signOut()` | No-op |

**Usage**: Selected when `config.authentication` is absent

---

### 5. McpService

**File**: `src/services/McpService.ts`
**Purpose**: MCP (Model Context Protocol) server communication

#### TODO: Methods & Protocol
- [ ] Document MCP server API
- [ ] Clarify streaming vs request/response
- [ ] Identify SSE usage (`eventsource` package)

---

### 6. OAuthService

**File**: `src/services/OAuthService.ts`
**Purpose**: OAuth 2.0 flows for test console

#### TODO: Implementation Details
- [ ] Authorization code flow
- [ ] Client credentials flow
- [ ] Token refresh
- [ ] Integration with `client-oauth2` package

---

### 7. LocalStorageService

**File**: `src/services/LocalStorageService.ts`
**Purpose**: Browser localStorage abstraction

#### Expected Methods
- `getItem(key)` - Retrieve from storage
- `setItem(key, value)` - Save to storage
- `removeItem(key)` - Delete from storage

**Usage**: Recent searches, user preferences

#### TODO: Verify Implementation
- [ ] Check if it exists (assumed based on naming convention)
- [ ] Document serialization strategy (JSON?)

---

### 8. LocationsService

**File**: `src/services/LocationsService.ts`
**Purpose**: URL generation for navigation

#### Expected Methods
- `getHomeUrl()` - Home page URL
- `getApiUrl(apiName)` - API detail URL
- `getSpecUrl(definitionId)` - Spec viewer URL

**Usage**: Header navigation, link generation

---

## Service Registration

### appServicesAtom

**File**: `src/atoms/appServicesAtom.ts`

**Structure**:
```typescript
// Base services (computed from config)
const base = {
  ApiService,
  AuthService: isAnonymousAccess ? AnonymousAuthService : MsalAuthService,
};

// Override mechanism for testing
const overrides = get(appServicesOverridesAtom);
return { ...base, ...overrides };
```

**Access Pattern**:
```typescript
// In React components
const { ApiService, AuthService } = useRecoilValue(appServicesAtom);

// In services (HttpService)
const { AuthService } = getRecoil(appServicesAtom);
```

---

## Service Interfaces

### IApiService

**Location**: `src/types/services/IApiService.ts`

**Purpose**: API Center client contract

**Methods**: See ApiService section above

---

### IAuthService

**Location**: `src/types/services/IAuthService.ts`

**Contract**:
```typescript
interface IAuthService {
  isAuthenticated(): Promise<boolean>;
  getAccessToken(): Promise<string>;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}
```

**Implementations**:
- `MsalAuthService` - Azure AD
- `AnonymousAuthService` - No-op

---

## Service Usage Patterns

### Via Hooks (Recommended)

```typescript
// Custom hook wraps service access
export const useApiService = () => {
  const { ApiService } = useRecoilValue(appServicesAtom);
  return ApiService;
};

// In component
const apiService = useApiService();
const { data } = useQuery({
  queryKey: ['api', name],
  queryFn: () => apiService.getApi(name),
});
```

### Direct Access (Components)

```typescript
const { ApiService } = useRecoilValue(appServicesAtom);
const apis = await ApiService.getApis('search term', filters);
```

### Imperative Access (Services)

```typescript
import { getRecoil } from 'recoil-nexus';
import { appServicesAtom } from '@/atoms/appServicesAtom';

const { AuthService } = getRecoil(appServicesAtom);
const token = await AuthService.getAccessToken();
```

---

## Service Dependencies

```
ApiService
  └─► HttpService
      ├─► configAtom (base URL)
      ├─► appServicesAtom (auth token)
      └─► isAccessDeniedAtom (error state)

MsalAuthService
  └─► configAtom (MSAL settings)

AnonymousAuthService
  └─► (no dependencies)

McpService
  └─► HttpService (TODO: verify)

OAuthService
  └─► client-oauth2 package
```

---

## Error Handling Strategy

### Service Layer
- Return `undefined` on error
- Log to console (dev warning)
- No exceptions thrown to consumers

### HTTP Layer
- 401/403: Set `isAccessDeniedAtom`, return `undefined`
- Other errors: Log, return `undefined`

### Consumer Layer (Hooks)
- React Query handles loading/error states
- Components display user-friendly messages

---

## Testing Services

### Mocking Pattern

```typescript
// Create mock
const mockApiService: IApiService = {
  getApi: jest.fn().mockResolvedValue({ name: 'test-api' }),
  getApis: jest.fn().mockResolvedValue([]),
  // ... other methods
};

// Inject via RootProvider
<RootProvider services={{ ApiService: mockApiService }}>
  <ComponentUnderTest />
</RootProvider>
```

### Test Scenarios
- [ ] Anonymous vs authenticated service switching
- [ ] HTTP error handling (401, 403, 500)
- [ ] Token refresh flow
- [ ] Caching behavior

---

## Service Extension Points

### Adding New Service

1. **Define Interface** (`src/types/services/IMyService.ts`)
```typescript
export interface IMyService {
  doSomething(): Promise<Result>;
}
```

2. **Implement** (`src/services/MyService.ts`)
```typescript
export const MyService: IMyService = {
  async doSomething() {
    // Implementation
  },
};
```

3. **Register** (`src/atoms/appServicesAtom.ts`)
```typescript
const base = {
  ApiService,
  AuthService: ...,
  MyService,  // Add here
};
```

4. **Create Hook** (`src/hooks/useMyService.ts`)
```typescript
export const useMyService = () => {
  const { MyService } = useRecoilValue(appServicesAtom);
  return MyService;
};
```

---

## TODO: Service Questions

- [ ] McpService implementation details
- [ ] OAuthService flow diagrams
- [ ] LocalStorageService methods and usage
- [ ] LocationsService method signatures
- [ ] Error telemetry service (if any)
- [ ] Rate limiting strategy
- [ ] Request retry logic
- [ ] Offline support (if any)
