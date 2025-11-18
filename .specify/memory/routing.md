# Routing & Navigation

## Overview

The application uses **React Router DOM v6** for client-side routing with nested route configuration. Navigation is primarily handled through React Router's `<Link>` and programmatic `useNavigate()` hook, with additional support for deep linking to API operations via URL parameters.

---

## Route Structure

### Root Route Configuration

Location: `src/main.tsx`

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'apis', element: <ApisPage /> },
      { path: 'apis/:apiName', element: <ApiDetailsPage /> },
      // Additional routes...
    ],
  },
]);
```

### Route Hierarchy

```
/                               → HomePage (landing/search)
/apis                           → ApisPage (list view)
/apis/:apiName                  → ApiDetailsPage (API detail with operations)
/apis/:apiName?operation=...    → ApiDetailsPage (with operation selected)
/apis/:apiName?version=...      → ApiDetailsPage (with version selected)
/apis/:apiName?definition=...   → ApiDetailsPage (with definition selected)
```

**Note**: Deep linking uses **URL search parameters** (not nested routes) for operation/version/definition state.

---

## Route Components

### Layout Component

- **Location**: `src/Layout.tsx`
- **Purpose**: Shared shell for all routes (header, footer, main content area)
- **Key Features**:
  - Persistent header with navigation and auth
  - Footer with version info and links
  - Renders `<Outlet />` for nested route content
  - Error boundary for route-level errors

### HomePage

- **Location**: `src/pages/HomePage/HomePage.tsx`
- **Purpose**: Landing page with search box and featured APIs
- **Entry Point**: Index route `/`

### ApisPage

- **Location**: `src/pages/ApisPage/ApisPage.tsx`
- **Purpose**: Full API catalog list with filters and search
- **Entry Point**: `/apis`
- **State Dependencies**: `apiSearchFiltersAtom`, `apiListLayoutAtom`, `apiListSortingAtom`

### ApiDetailsPage

- **Location**: `src/pages/ApiDetailsPage/ApiDetailsPage.tsx`
- **Purpose**: Single API details with versions, definitions, operations, test console
- **Entry Point**: `/apis/:apiName`
- **URL Parameters**:
  - `:apiName` (route param) — API name (required)
  - `?version=` (query param) — Selected version
  - `?definition=` (query param) — Selected definition
  - `?operation=` (query param) — Selected operation ID
  - `?deployment=` (query param) — Selected deployment (for test console)

---

## Navigation Patterns

### 1. Declarative Navigation (Links)

**Usage**: Primary navigation (header, API cards, internal links)

```tsx
import { Link } from 'react-router-dom';

<Link to="/apis">Browse All APIs</Link>
<Link to={`/apis/${api.name}`}>View {api.title}</Link>
```

**Header Navigation** (src/components/Header/Header.tsx):
```tsx
<Link to="/">Home</Link>
<Link to="/apis">APIs</Link>
```

### 2. Programmatic Navigation

**Usage**: After form submission, conditional redirects, dynamic navigation

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to API detail after search
navigate(`/apis/${selectedApi.name}`);

// Navigate with query params
navigate(`/apis/${apiName}?operation=${operationId}`);

// Navigate back
navigate(-1);
```

**Example**: `ApiSearchBox` navigates to API detail on selection.

### 3. Deep Linking (Query Params)

**Usage**: Shareable links to specific operation, version, or definition

**Pattern**:
```
/apis/petstore?version=v2&definition=openapi&operation=getPetById
```

**Implementation** (ApiDetailsPage):
```tsx
const [searchParams, setSearchParams] = useSearchParams();

const selectedOperation = searchParams.get('operation');
const selectedVersion = searchParams.get('version');
const selectedDefinition = searchParams.get('definition');

// Update URL on operation select
setSearchParams({ operation: operationId });
```

**Benefits**:
- Bookmarkable operation/definition URLs
- Back button works for operation navigation
- No nested routes complexity

---

## URL Parameter Management

### useSearchParams Hook

**Location**: React Router DOM built-in hook

**Usage in ApiDetailsPage**:
```tsx
const [searchParams, setSearchParams] = useSearchParams();

// Read
const operation = searchParams.get('operation');

// Write (merges with existing params)
setSearchParams({ ...Object.fromEntries(searchParams), operation: 'newOp' });

// Clear
setSearchParams({});
```

### URLParams Constants

**Location**: `src/constants/urlParams.ts`

**Purpose**: Centralized query param key constants

```typescript
export const URL_PARAMS = {
  OPERATION: 'operation',
  VERSION: 'version',
  DEFINITION: 'definition',
  DEPLOYMENT: 'deployment',
  // etc.
} as const;
```

**Usage**:
```tsx
const operationId = searchParams.get(URL_PARAMS.OPERATION);
```

---

## LocationsService Integration

### Purpose

Manages browser location history and query parameters imperatively (outside React components).

**Location**: `src/services/LocationsService/` (implementation TODO: verify methods)

**Potential Methods** (based on usage patterns):
```typescript
interface ILocationsService {
  updateQueryParams(params: Record<string, string>): void;
  getQueryParam(key: string): string | null;
  navigateTo(path: string): void;
  goBack(): void;
}
```

**Use Case**: Update URL from non-React code (e.g., analytics, event handlers, imperative redirects).

---

## Route Guards & Protected Routes

### Authentication Guard

**Pattern**: Conditionally render routes based on `isAuthenticatedAtom`

**Implementation** (if needed):
```tsx
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);
  const isAnonymousEnabled = useRecoilValue(isAnonymousAccessEnabledAtom);

  if (!isAuthenticated && !isAnonymousEnabled) {
    return <Navigate to="/" replace />;
  }

  return children;
};
```

**Current State**: No protected routes (anonymous access supported).

### Access Denied State

**Atom**: `isAccessDeniedAtom`

**Trigger**: 401/403 responses from API Center → set to `true`

**UI Response**: Show "Access Denied" message in `ApiDetailsPage` or `ApisPage` instead of data.

---

## Navigation State Persistence

### Recent Searches

- **Atom**: `recentSearchesAtom`
- **Persistence**: localStorage (via Recoil effects)
- **Usage**: Populate search suggestions on homepage

### Filter State

- **Atom**: `apiSearchFiltersAtom`
- **Persistence**: Session-only (lost on refresh)
- **Scope**: ApisPage filters (version, definition, lifecycle, custom metadata)

### Layout Preferences

- **Atom**: `apiListLayoutAtom` (grid vs list)
- **Persistence**: localStorage (persisted across sessions)
- **Scope**: ApisPage layout toggle

---

## Routing Best Practices

1. **Use URL Params for Shareable State**: Operation/version/definition selection → query params (shareable, bookmarkable).
2. **Use Atoms for Transient State**: Filters, sorting, layout preferences → atoms (faster, no URL clutter).
3. **Avoid Nested Routes for Simple UI**: React Router v6 nested routes add complexity; query params sufficient for this app.
4. **Centralize URL Param Keys**: Use `urlParams.ts` constants to avoid typos.
5. **Sync URL with State**: Use `useEffect` to sync `searchParams` changes to component state.
6. **Guard Against Invalid Params**: Validate `apiName`, `operation`, etc. before fetching data.
7. **Preserve URL on Error**: Don't redirect on 404 API; show error message with URL intact.

---

## Error Boundaries

### Route-Level Error Boundary

**Location**: Layout component (wraps `<Outlet />`)

**Purpose**: Catch render errors in route components without crashing app.

**Fallback**: Show error message with "Go Home" button.

---

## TODO: Routing

- [ ] Verify `LocationsService` methods and signatures
- [ ] Document 404 Not Found route (if exists)
- [ ] Document redirect routes (e.g., `/apis/:apiName/` → `/apis/:apiName`)
- [ ] Verify if error boundary exists in Layout.tsx
- [ ] Document scroll restoration strategy (scroll to top on navigation?)
- [ ] Verify if route-based code splitting implemented
- [ ] Document deep link validation logic (invalid operation ID handling)
- [ ] Verify if programmatic navigation uses `replace` vs `push` strategically
- [ ] Document navigation analytics events (if any)
- [ ] Verify if `useLocation()` used for tracking current route
