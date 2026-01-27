# Design Patterns & Conventions

## Core Patterns

### 1. Service Layer Pattern

**Purpose**: Abstract external API communication and business logic

**Structure**:
```
Interface → Implementation → Registration → Consumption
IApiService → ApiService → appServicesAtom → useApiService hook
```

**Example**:
```typescript
// Interface (types/services/IApiService.ts)
export interface IApiService {
  getApis(search: string, filters: ActiveFilterData[]): Promise<ApiMetadata[]>;
  getApi(name: string): Promise<ApiMetadata>;
}

// Implementation (services/ApiService.ts)
export const ApiService: IApiService = {
  async getApis(search, filters) {
    // Implementation
  },
};

// Registration (atoms/appServicesAtom.ts)
const base = { ApiService, AuthService: MsalAuthService };

// Consumption (hooks/useApiService.ts)
const { ApiService } = useRecoilValue(appServicesAtom);
```

**Benefits**:
- Swappable implementations (MSAL vs Anonymous auth)
- Testable (mock services)
- Centralized HTTP logic

---

### 2. Strategy Pattern (Authentication)

**Purpose**: Switch authentication strategies at runtime

**Implementation**:
```
IAuthService interface
├── MsalAuthService (Azure AD)
└── AnonymousAuthService (no auth)
```

**Selection Logic**:
```typescript
// appServicesAtom.ts
const config = get(configAtom);
const isAnonymousAccess = !config?.authentication;
AuthService: isAnonymousAccess ? AnonymousAuthService : MsalAuthService
```

**Key Methods**:
- `isAuthenticated(): Promise<boolean>`
- `getAccessToken(): Promise<string>`
- `signIn(): Promise<void>`
- `signOut(): Promise<void>`

---

### 3. Custom Hooks Pattern

**Purpose**: Encapsulate data fetching and business logic

**Convention**:
```typescript
export const use[Feature] = (params) => {
  const service = useRecoilValue(appServicesAtom);
  const query = useQuery({
    queryKey: ['feature', params],
    queryFn: () => service.ApiService.getFeature(params),
  });
  return query;
};
```

**Examples**:
- `useApi(name)` - Single API
- `useApis()` - API list
- `useApiSpec(definitionId)` - Spec with parsing
- `useApiVersions(apiName)` - Versions

**Pattern**: React Query + Service Layer + Recoil

---

### 4. Atomic State Pattern (Recoil)

**Purpose**: Granular state management with derived state

**Types**:

**Atom** (writable state):
```typescript
export const configAtom = atom<Config>({
  key: 'config',
  default: undefined,
});
```

**Selector** (computed state):
```typescript
export const isAnonymousAccessEnabledAtom = selector<boolean>({
  key: 'isAnonymousAccessEnabled',
  get: ({ get }) => {
    const config = get(configAtom);
    return !config?.authentication;
  },
});
```

**Atom with Effect** (async initialization):
```typescript
export const isAuthenticatedAtom = atom<boolean>({
  key: 'isAuthenticated',
  default: false,
  effects: [
    ({ setSelf, getLoadable }) => {
      const tryResolve = () => {
        const auth = getLoadable(appServicesAtom).contents?.AuthService;
        if (!auth) {
          setTimeout(tryResolve, 0);
          return;
        }
        auth.isAuthenticated().then(setSelf).catch(() => setSelf(false));
      };
      setTimeout(tryResolve, 0);
    },
  ],
});
```

---

### 5. Writable Selector Pattern

**Purpose**: Allow writes to computed state (with overrides)

**Implementation** (`appServicesAtom`):
```typescript
const appServicesOverridesAtom = atom<Partial<AppServicesAtomState>>({
  key: 'appServices/overrides',
  default: {},
});

export const appServicesAtom = selector<AppServicesAtomState>({
  key: 'appServices',
  get: ({ get }) => {
    const base = { ApiService, AuthService: MsalAuthService };
    const overrides = get(appServicesOverridesAtom);
    return { ...base, ...overrides };
  },
  set: ({ set }, newValue) => {
    set(appServicesOverridesAtom, newValue);
  },
});
```

**Use Case**: Override services for testing while keeping base computation

---

### 6. Memoization Pattern

**Purpose**: Cache expensive operations

**HTTP Caching**:
```typescript
const makeRequestWithCache = memoizee(makeRequest);

export const HttpService = {
  get<T>(endpoint: string): Promise<T> {
    return makeRequestWithCache<T>(endpoint, 'GET');
  },
};
```

**Spec Caching**:
```typescript
getSpecification: memoize(async (definitionId) => {
  const url = await ApiService.getSpecificationLink(definitionId);
  const res = await fetch(url);
  return res.text();
}),
```

---

### 7. Spec Reader Pattern

**Purpose**: Parse different API spec formats

**Structure**:
```
getSpecReader(type) → returns reader
├── openApiV2Reader
├── openApiV3Reader
├── graphqlReader
└── mcpReader
```

**Usage**:
```typescript
const reader = getSpecReader(definition.specification.name);
const parsed = await reader.read(specContent);
```

---

### 8. Experience Composition Pattern

**Purpose**: Build complex features from smaller components

**Structure**:
```
Experience (ApiList)
├── Component (ApiSearchBox)
├── Component (ApiFilters)
├── Component (ApiListLayoutSwitch)
└── Component (Table/Cards from Fluent UI)
```

**Convention**: Experiences orchestrate, components render

---

### 9. SCSS Module Pattern

**Purpose**: Scoped styling with design tokens

**Convention**:
```typescript
import styles from './Component.module.scss';

<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

**SCSS File**:
```scss
.container {
  padding: var(--spacing-large);
}

.title {
  color: var(--colorBrandForeground1);
}
```

**Conditional Classes**:
```typescript
import classNames from 'classnames';

<div className={classNames(styles.navLinks, {
  [styles.navLinksNoSeparator]: isAnonymous
})}>
```

---

### 10. Route Nesting Pattern

**Purpose**: Nested routes with shared layouts

**Structure**:
```typescript
createBrowserRouter([
  {
    element: <Layout />,  // Header + Footer
    children: [
      {
        path: '/',
        element: <Home />,
        children: [
          {
            path: 'api-info/:id',
            element: <ApiInfo />,  // Rendered in <Outlet /> of Home
          },
        ],
      },
    ],
  },
]);
```

---

## Naming Conventions

### Files
- **Components**: PascalCase (`Header.tsx`)
- **Hooks**: camelCase starting with `use` (`useApi.ts`)
- **Services**: PascalCase ending with `Service` (`ApiService.ts`)
- **Atoms**: camelCase ending with `Atom` (`configAtom.ts`)
- **Types**: camelCase (`config.ts`, `api.ts`)
- **Styles**: Same as component + `.module.scss` (`Header.module.scss`)

### Variables
- **React components**: PascalCase (`const MyComponent`)
- **Hooks**: camelCase starting with `use` (`const useMyHook`)
- **Constants**: SCREAMING_SNAKE_CASE (`const API_BASE_URL`)
- **Functions**: camelCase (`function fetchData()`)
- **Types/Interfaces**: PascalCase (`interface Config`, `type ApiMetadata`)

### Atoms/Selectors
- **Atom keys**: camelCase matching variable name (`key: 'configAtom'` → `configAtom`)
- **Selector keys**: Same convention
- **Internal atoms**: Suffix with path (`key: 'appServices/overrides'`)

---

## Code Organization Conventions

### Import Ordering
1. External packages (react, lodash, etc.)
2. Internal aliases (`@/atoms`, `@/services`, etc.)
3. Relative imports (`./Component`)
4. Styles (last)

### Component Structure
```typescript
// 1. Imports
import React from 'react';
import { useRecoilValue } from 'recoil';
import styles from './Component.module.scss';

// 2. Types/Interfaces
interface Props {
  title: string;
}

// 3. Component
export const Component: React.FC<Props> = ({ title }) => {
  // 3a. Hooks
  const config = useRecoilValue(configAtom);
  
  // 3b. State
  const [count, setCount] = useState(0);
  
  // 3c. Callbacks
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  // 3d. Effects
  useEffect(() => {
    // Side effect
  }, []);
  
  // 3e. Render
  return <div className={styles.container}>{title}</div>;
};

// 4. Export
export default React.memo(Component);
```

---

## Anti-Patterns to Avoid

### ❌ Direct Fetch in Components
```typescript
// Bad
const [data, setData] = useState();
useEffect(() => {
  fetch('/api').then(r => r.json()).then(setData);
}, []);
```

```typescript
// Good
const { data } = useApi(name);
```

### ❌ Hardcoded API Endpoints
```typescript
// Bad
const url = 'https://contoso.data.eastus.azure-apicenter.ms/apis';
```

```typescript
// Good
const config = getRecoil(configAtom);
const url = `https://${config.dataApiHostName}/apis`;
```

### ❌ Auth Logic in Components
```typescript
// Bad
if (config.authentication) {
  return <SignInButton />;
}
```

```typescript
// Good
const isAnonymous = useRecoilValue(isAnonymousAccessEnabledAtom);
if (!isAnonymous) {
  return <AuthBtn />;
}
```

### ❌ Inline Styles
```typescript
// Bad
<div style={{ padding: '16px' }}>Content</div>
```

```typescript
// Good
<div className={styles.container}>Content</div>
```

### ❌ Prop Drilling
```typescript
// Bad
<Parent config={config}>
  <Child config={config}>
    <GrandChild config={config} />
  </Child>
</Parent>
```

```typescript
// Good
// Parent doesn't pass config
<Parent>
  <Child>
    <GrandChild />  // Uses useRecoilValue(configAtom)
  </Child>
</Parent>
```

---

## Best Practices

### State Management
- **UI state**: Local component state
- **Shared UI state**: Recoil atoms (filters, layout preferences)
- **Server state**: React Query (API data)
- **Derived state**: Recoil selectors (computed values)

### Error Handling
- **Service layer**: Return `undefined` on error, log to console
- **Hooks**: React Query handles loading/error states
- **Components**: Display user-friendly error messages
- **HTTP 401/403**: Set `isAccessDeniedAtom`, show access denied page

### Performance
- **Memoization**: Use for expensive computations and HTTP GET
- **React.memo**: Wrap exported components
- **useCallback**: For event handlers passed as props
- **useMemo**: For expensive derived values
- **Atom granularity**: Small atoms > large atoms (fewer re-renders)

### Accessibility
- **Semantic HTML**: Use `<button>`, `<nav>`, `<main>`, etc.
- **ARIA labels**: Add to icons and complex widgets
- **Keyboard nav**: All interactive elements focusable
- **Focus management**: Trap focus in modals, restore on close

---

## TODO: Pattern Clarifications

- [ ] Document OAuth 2.0 flow pattern in test console
- [ ] Clarify MCP reader implementation details
- [ ] Document error telemetry pattern (if exists)
- [ ] Spec reader registration mechanism
- [ ] Verify rehype-raw sanitization pattern
