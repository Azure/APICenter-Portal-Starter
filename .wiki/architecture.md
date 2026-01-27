# Architecture Overview

## System Type

**Single-Page Application (SPA)** - React-based frontend portal for Azure API Center

## Architectural Style

**Component-Based Frontend with Service Layer**
- Presentation layer (React components)
- Application layer (hooks, experiences)
- Service layer (API clients, auth)
- State management (Recoil atoms/selectors)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Browser / User                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                React Application (SPA)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Presentation Layer (Pages/Layout)         │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │                                   │
│  ┌───────────────────▼───────────────────────────────┐  │
│  │    Experience Layer (ApiList, TestConsole, etc.)  │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │                                   │
│  ┌───────────────────▼───────────────────────────────┐  │
│  │      Component Layer (Header, Footer, etc.)       │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │                                   │
│  ┌───────────────────▼───────────────────────────────┐  │
│  │         Application Layer (Hooks)                 │  │
│  │    useApi, useApiSpec, useAuthService, etc.       │  │
│  └─────┬──────────────────────────────────────┬──────┘  │
│        │                                       │          │
│  ┌─────▼──────────┐                    ┌──────▼──────┐  │
│  │ State Mgmt     │                    │  Service    │  │
│  │ (Recoil)       │                    │  Layer      │  │
│  │ - Atoms        │◄───────────────────┤ - ApiService│  │
│  │ - Selectors    │                    │ - AuthSvc   │  │
│  │ - Effects      │                    │ - HttpSvc   │  │
│  └────────────────┘                    └──────┬──────┘  │
│                                               │          │
└───────────────────────────────────────────────┼──────────┘
                                                │
                        ┌───────────────────────▼──────────┐
                        │   Azure API Center Data Plane    │
                        │   (REST API)                     │
                        └──────────────────────────────────┘
```

## Layer Descriptions

### 1. Presentation Layer
**Location**: `src/pages/`, `src/Layout.tsx`

**Responsibilities**:
- Route-level components (Home, ApiInfo, ApiSpec)
- Layout structure (Header, main content, Footer)
- Page-level composition

**Key Files**:
- `App.tsx` - Router setup, config initialization
- `Layout.tsx` - Common page structure
- `pages/Home/`, `pages/ApiInfo/`, `pages/ApiSpec/`

**Dependencies**: Experience layer, Component layer

---

### 2. Experience Layer
**Location**: `src/experiences/`

**Responsibilities**:
- Feature-specific composite components
- Business logic orchestration
- Multi-component workflows

**Key Experiences**:
- `ApiList` - API browsing and filtering
- `ApiFilters` - Filter UI and logic
- `ApiSearchBox` - Search with semantic option
- `HttpTestConsole` - HTTP API testing
- `McpTestConsole` - MCP server testing
- `ApiOperationDetails` - Operation spec display
- `ApiInfoOptions` - Action buttons (VS Code, etc.)

**Dependencies**: Component layer, hooks, state

---

### 3. Component Layer
**Location**: `src/components/`

**Responsibilities**:
- Reusable UI components
- Low-level visual elements
- No direct business logic

**Key Components**:
- `Header` - App header with auth button
- `Footer` - App footer
- `MarkdownRenderer` - Markdown display
- `CopyLink` - Copy-to-clipboard button
- `CustomMetadata` - Metadata display
- `RefLink` - Reference link component

**Dependencies**: Fluent UI, minimal hooks

---

### 4. Application Layer (Hooks)
**Location**: `src/hooks/`

**Responsibilities**:
- Data fetching abstraction
- Business logic encapsulation
- React Query integration
- State access patterns

**Key Hooks**:
- `useApi(name)` - Fetch single API
- `useApis()` - Fetch API list
- `useApiSpec(definitionId)` - Fetch and parse spec
- `useApiVersions(apiName)` - Fetch versions
- `useApiDeployments(apiName)` - Fetch deployments
- `useAuthService()` - Access auth service
- `useSearchQuery()` - Search orchestration

**Dependencies**: Services, Recoil atoms, React Query

---

### 5. Service Layer
**Location**: `src/services/`

**Responsibilities**:
- External API communication
- Authentication management
- HTTP request abstraction
- Business logic isolation

**Key Services**:
- `ApiService` - Azure API Center data plane client
- `HttpService` - Generic HTTP client with auth
- `MsalAuthService` - Azure AD authentication
- `AnonymousAuthService` - No-auth mode
- `McpService` - MCP server communication
- `OAuthService` - OAuth 2.0 flows
- `LocalStorageService` - Browser storage
- `LocationsService` - URL generation

**Dependencies**: External APIs, browser APIs

---

### 6. State Management Layer
**Location**: `src/atoms/`

**Responsibilities**:
- Global application state
- Derived state computation
- State initialization and effects

**Key Atoms**:
- `configAtom` - Runtime configuration
- `appServicesAtom` - Service instances (writable selector)
- `isAuthenticatedAtom` - Auth state (with effect)
- `isAnonymousAccessEnabledAtom` - Access mode (selector)
- `apiSearchFiltersAtom` - Active filters
- `recentSearchesAtom` - Search history

**Dependencies**: Services (via effects)

---

### 7. Type System
**Location**: `src/types/`

**Responsibilities**:
- TypeScript type definitions
- API response contracts
- Interface definitions

**Key Types**:
- `config.ts` - Application config
- `api.ts` - API metadata
- `apiDefinition.ts` - API definition
- `apiSpec.ts` - Spec types (OpenAPI, GraphQL, etc.)
- `services/IApiService.ts` - Service interfaces
- `services/IAuthService.ts` - Auth interface

---

### 8. Utility Layer
**Location**: `src/utils/`, `src/specReaders/`

**Responsibilities**:
- Pure helper functions
- Spec parsing (OpenAPI, GraphQL, MCP)
- Data transformation

**Key Utilities**:
- `specReaders/` - Parse API specs
- `utils/` - General helpers

---

## Cross-Cutting Concerns

### Authentication
- **Pattern**: Strategy pattern via `IAuthService`
- **Implementations**: `MsalAuthService`, `AnonymousAuthService`
- **Switch**: Based on `config.authentication` presence
- **Flow**: Config loaded → service selected → atom initialized

### Error Handling
- **HTTP errors**: Caught in `HttpService`, set `isAccessDeniedAtom` on 401/403
- **Component errors**: Local error states, user-friendly messages
- **Atom effects**: Catch rejected promises, set fallback values

### Caching
- **HTTP GET**: Memoized in `HttpService` via `memoizee`
- **Spec fetching**: Memoized in `ApiService.getSpecification`
- **React Query**: Automatic caching with configurable stale times

### Routing
- **Library**: React Router v6
- **Structure**: Nested routes with `<Outlet />`
- **Routes**:
  - `/` - Home (API list)
  - `/api-info/:id` - API details (nested in Home)
  - `/apis/:apiName/versions/:versionName/definitions/:definitionName` - Spec viewer

---

## Data Flow

### Typical Request Flow

1. **User Action** → Component/Experience
2. **Hook Call** → `useApi()`, `useApis()`, etc.
3. **React Query** → Check cache or fetch
4. **Service Layer** → `ApiService.getApi(name)`
5. **HTTP Service** → Add auth token, make request
6. **Azure API Center** → Return JSON response
7. **Response** → Transform via hook
8. **Component** → Render data

### State Update Flow

1. **Config Fetch** (on mount) → `App.tsx` sets `configAtom`
2. **Services Compute** → `appServicesAtom` selector recomputes
3. **Auth State** → `isAuthenticatedAtom` effect calls `AuthService.isAuthenticated()`
4. **UI Reacts** → Components using atoms re-render

---

## Initialization Sequence

```
1. Browser loads index.html
2. Vite loads main.tsx
3. main.tsx renders <RootProvider> (Recoil root)
4. RootProvider initializes appServicesAtom with overrides (if any)
5. <App /> mounts
6. App.tsx fetches /config.json
7. Sets configAtom
8. appServicesAtom recomputes (MsalAuthService or AnonymousAuthService)
9. isAuthenticatedAtom effect runs
10. Waits for AuthService to be ready
11. Calls AuthService.isAuthenticated()
12. Sets authentication state
13. Router initializes with routes
14. <Layout /> renders (Header, <Outlet />, Footer)
15. Home page loads, fetches API list
```

---

## Key Design Decisions

### Why Recoil over Redux?
- Atomic state updates (granular re-renders)
- Selector composition (derived state)
- Async effects built-in
- Less boilerplate

### Why React Query?
- Server state management separate from UI state
- Automatic caching and refetching
- Loading/error states handled
- Integrates well with Recoil

### Why Service Layer?
- Abstracts HTTP implementation
- Enables testing (service mocking)
- Centralizes auth token injection
- Supports auth strategy switching

### Why Selector for appServicesAtom?
- Reacts to config changes (anonymous vs authenticated)
- Allows overrides (for testing)
- Single source of truth for service instances

### Why Effect in isAuthenticatedAtom?
- Async auth check on mount
- Waits for services to initialize (startup race guard)
- Sets initial auth state before UI renders

---

## Extension Points

### Adding New API Endpoints
1. Add method to `IApiService` interface
2. Implement in `ApiService`
3. Create hook in `src/hooks/`
4. Use in components

### Adding New Authentication Provider
1. Implement `IAuthService` interface
2. Add to `appServicesAtom` selector logic
3. Update `configAtom` type if needed

### Adding New Page
1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Update `LocationsService` for URL generation

### Adding New State
1. Create atom/selector in `src/atoms/`
2. Use in hooks or components
3. Document in state-management.md

---

## TODO: Unknown/Ambiguous Areas

- [ ] Semantic search implementation details (backend API)
- [ ] MCP server protocol specifics
- [ ] OAuth 2.0 flow variations supported
- [ ] Rate limiting strategy
- [ ] Error telemetry (if any)
- [ ] Multi-workspace support (currently hardcoded `/workspaces/default`)
- [ ] API Center SKU detection logic
