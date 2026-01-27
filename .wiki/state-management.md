# State Management Architecture

## State Categories

### 1. Application Configuration
- **Atom**: `configAtom`
- **Type**: `Config`
- **Initialized**: On app mount via `/config.json` fetch
- **Consumers**: All features (via selectors or direct access)

**Structure**:
```typescript
{
  dataApiHostName: string;           // Azure API Center endpoint
  title: string;                     // Portal title
  authentication?: MsalSettings;     // Optional auth config
  scopingFilter: string;             // Metadata filter
  capabilities: AppCapabilities[];   // Feature flags (semantic search, etc.)
}
```

---

### 2. Service Instances
- **Selector**: `appServicesAtom` (writable)
- **Type**: `AppServicesAtomState`
- **Initialized**: On Recoil root init
- **Reactivity**: Recomputes when `configAtom` changes (TODO: verify in current impl)

**Structure**:
```typescript
{
  ApiService?: IApiService;    // Azure API Center client
  AuthService?: IAuthService;  // MSAL or Anonymous
}
```

**Pattern**:
```
configAtom changes → appServicesAtom recomputes → AuthService switches
```

**Override Mechanism**:
```typescript
// For testing
<RootProvider services={{ ApiService: mockApiService }}>
  <App />
</RootProvider>
```

---

### 3. Authentication State
- **Atom**: `isAuthenticatedAtom`
- **Type**: `boolean`
- **Default**: `false`
- **Effect**: Async check via `AuthService.isAuthenticated()`

**Initialization Sequence**:
1. Atom created with default `false`
2. Effect runs on mount
3. Waits for `appServicesAtom` to have `AuthService` (retry loop)
4. Calls `AuthService.isAuthenticated()`
5. Sets atom value to result

**Consumers**:
- Home page (render decision)
- Access control checks

---

### 4. Anonymous Access Detection
- **Selector**: `isAnonymousAccessEnabledAtom`
- **Type**: `boolean`
- **Computed**: `!config?.authentication`

**Usage**:
```typescript
const isAnonymous = useRecoilValue(isAnonymousAccessEnabledAtom);

if (!isAnonymous) {
  return <AuthBtn />;
}
```

**Dependent UI**:
- Header auth button visibility
- Header separator visibility
- VS Code integration buttons
- Sign-in prompts

---

### 5. Access Denied State
- **Atom**: `isAccessDeniedAtom`
- **Type**: `boolean`
- **Default**: `false`
- **Set**: By `HttpService` on 401/403 responses

**Usage**:
- Show access denied page
- Trigger re-authentication flow

---

### 6. API Search & Filtering

#### Search Filters
- **Atom**: `apiSearchFiltersAtom`
- **Type**: `ActiveFilterData[]`
- **Default**: `[]`

**Structure**:
```typescript
interface ActiveFilterData {
  type: string;   // e.g., 'kind', 'lifecycleStage'
  value: string;  // e.g., 'rest', 'production'
}
```

**Updated By**: `ApiFilters` experience, `ActiveFiltersBadges` component

#### Recent Searches
- **Atom**: `recentSearchesAtom`
- **Type**: `string[]`
- **Default**: `[]`
- **Persistence**: LocalStorage (TODO: verify)

---

### 7. API List UI State

#### Layout Preference
- **Atom**: `apiListLayoutAtom`
- **Type**: `'list' | 'grid'`
- **Default**: `'list'`

#### Sorting Preference
- **Atom**: `apiListSortingAtom`
- **Type**: `SortingOption`
- **Default**: Name ascending (TODO: verify)

---

## State Dependency Graph

```
configAtom (fetched on mount)
  ├─► appServicesAtom (selector, computes AuthService)
  │     └─► isAuthenticatedAtom (effect, calls AuthService)
  │
  └─► isAnonymousAccessEnabledAtom (selector, checks config.authentication)
        └─► Header visibility logic
        └─► ApiInfoOptions VS Code buttons

HttpService (on 401/403)
  └─► isAccessDeniedAtom

User interactions
  ├─► apiSearchFiltersAtom
  ├─► recentSearchesAtom
  ├─► apiListLayoutAtom
  └─► apiListSortingAtom
```

---

## Atom Initialization Timeline

```
T0: Browser loads, Recoil root initialized
  ├─ All atoms created with defaults
  └─ appServicesAtom selector computes initial value (config not set yet)
  
T1: App.tsx mounts
  └─ Fetches /config.json
  
T2: Config fetched
  ├─ setConfig(configAtom, data)
  └─ appServicesAtom recomputes (now has config)
  
T3: appServicesAtom updated
  └─ isAuthenticatedAtom effect sees AuthService
      └─ Calls AuthService.isAuthenticated()
      
T4: Auth check complete
  └─ isAuthenticatedAtom set to true/false
  └─ Router renders appropriate pages
```

---

## State Access Patterns

### Inside React Components
```typescript
// Read
const config = useRecoilValue(configAtom);

// Write
const setConfig = useSetRecoilState(configAtom);

// Read + Write
const [config, setConfig] = useRecoilState(configAtom);
```

### Outside React (Service Layer)
```typescript
import { getRecoil, setRecoil } from 'recoil-nexus';

// Read
const config = getRecoil(configAtom);

// Write
setRecoil(isAccessDeniedAtom, true);
```

**Usage**: `HttpService.ts` (get config, set access denied)

---

## State Update Strategies

### Synchronous Updates
```typescript
// Direct set
setRecoilState(apiListLayoutAtom, 'grid');

// Functional update
setRecoilState(filtersAtom, prev => [...prev, newFilter]);
```

### Asynchronous Updates (via Effects)
```typescript
const myAtom = atom({
  key: 'myAtom',
  effects: [
    ({ setSelf }) => {
      fetchData().then(setSelf);
    },
  ],
});
```

**Example**: `isAuthenticatedAtom` effect

### Computed State (via Selectors)
```typescript
const derivedAtom = selector({
  key: 'derived',
  get: ({ get }) => {
    const base = get(baseAtom);
    return transform(base);
  },
});
```

**Example**: `isAnonymousAccessEnabledAtom`

---

## State Persistence

### LocalStorage Integration
- **Service**: `LocalStorageService.ts`
- **Pattern**: Atom effects write to localStorage on change
- **Atoms**: `recentSearchesAtom` (TODO: verify others)

**Pattern**:
```typescript
const persistedAtom = atom({
  key: 'persisted',
  default: localStorage.getItem('key') || defaultValue,
  effects: [
    ({ onSet }) => {
      onSet(value => {
        localStorage.setItem('key', JSON.stringify(value));
      });
    },
  ],
});
```

---

## State Testing

### Mocking in Tests
```typescript
// Mock service
const mockApiService = { getApi: jest.fn() };

// Provide to test
<RecoilRoot initializeState={({ set }) => {
  set(appServicesAtom, { ApiService: mockApiService });
}}>
  <ComponentUnderTest />
</RecoilRoot>
```

### Snapshot Testing
```typescript
const snapshot = await getRecoilState(myAtom);
expect(snapshot).toEqual(expectedValue);
```

---

## Atom File Organization

**Location**: `src/atoms/`

**Naming**: `[feature][State]Atom.ts`

**Examples**:
- `configAtom.ts` - App config
- `appServicesAtom.ts` - Services
- `isAuthenticatedAtom.ts` - Auth state
- `apiListLayoutAtom.ts` - Layout preference
- `apiSearchFiltersAtom.ts` - Active filters

**Convention**: One atom/selector per file (except related overrides)

---

## State Update Rules

### When to Use Atoms
- Global state shared across many components
- State that persists across route changes
- User preferences (layout, sorting, etc.)

### When to Use Selectors
- Derived/computed state
- State that depends on other atoms
- Read-only values from multiple sources

### When to Use Local State
- Component-specific UI state (open/closed, hover, etc.)
- Forms before submission
- Temporary values not shared

### When to Use React Query
- Server data (APIs, specs, etc.)
- Data that needs caching and refetching
- Loading/error states for async data

---

## Performance Considerations

### Atom Granularity
**Good**: Small, focused atoms
```typescript
apiListLayoutAtom (just layout)
apiListSortingAtom (just sorting)
```

**Bad**: One large atom
```typescript
apiListStateAtom {
  layout: 'list',
  sorting: 'name',
  filters: [],
  // ... many fields
}
```

**Reason**: Smaller atoms = fewer re-renders (only consumers of changed atom update)

### Selector Memoization
- Selectors automatically memoize based on dependencies
- Re-compute only when dependencies change
- Cheap to read multiple times

### Atom Effects
- Run once on initialization
- Can cause waterfalls if not careful
- Use retry loops for async dependencies (see `isAuthenticatedAtom`)

---

## TODO: State Questions

- [ ] Is `recentSearchesAtom` actually persisted to localStorage?
- [ ] Does `appServicesAtom` recompute when `configAtom` changes? (Current impl doesn't seem reactive)
- [ ] Are there other persisted atoms besides recent searches?
- [ ] Is there state for API spec cache beyond React Query?
- [ ] Error telemetry state (if any)?
- [ ] Multi-workspace state (future feature)?
