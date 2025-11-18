# Third-Party Dependencies

## Core Framework

| Package | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `react` | 18.3.1 | UI library | Component rendering |
| `react-dom` | 18.3.1 | DOM rendering | Browser integration |
| `typescript` | 5.7.2 | Type system | Static typing |
| `vite` | 6.0.5 | Build tool | Dev server, bundling |

---

## Routing

| Package | Version | Purpose | Critical Areas |
|---------|---------|---------|----------------|
| `react-router-dom` | 6.22.3 | Client routing | App.tsx, Layout.tsx, navigation |

**Routes**:
- `/` - Home
- `/api-info/:id` - API details (nested)
- `/apis/:apiName/versions/:versionName/definitions/:definitionName` - Spec viewer

---

## State Management

| Package | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `recoil` | 0.7.7 | Global state | Atoms, selectors, effects |
| `recoil-nexus` | 0.5.1 | Imperative access | Service layer state access |
| `@tanstack/react-query` | 5.85.5 | Server state | Data fetching, caching |

**Key Pattern**: Recoil for app state, React Query for API data

---

## UI Framework

| Package | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `@fluentui/react-components` | 9.56.8 | Component library | All UI components |
| `@microsoft/api-docs-ui` | 1.0.29 | API doc rendering | OpenAPI spec display |

**Design System**: Microsoft Fluent UI

---

## Authentication

| Package | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `@azure/msal-browser` | 3.13.0 | Azure AD auth | MsalAuthService |
| `client-oauth2` | 4.3.3 | OAuth 2.0 flows | Test console auth |

**Modes**:
- Authenticated: Uses MSAL
- Anonymous: No auth library (custom implementation)

---

## Content Rendering

| Package | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `react-markdown` | 9.0.1 | Markdown rendering | API descriptions |
| `remark-gfm` | 4.0.0 | GitHub Flavored Markdown | Tables, strikethrough, etc. |
| `rehype-raw` | 7.0.0 | HTML in markdown | Unsafe HTML rendering |
| `rehype-truncate` | 1.2.2 | Text truncation | Summary previews |

---

## Spec Parsing

| Package | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `openapi-types` | 12.1.3 | OpenAPI TypeScript types | OpenAPI spec parsing |
| `graphql` | 16.10.0 | GraphQL parsing | GraphQL spec display |
| `yaml` | 2.7.0 | YAML parsing | YAML spec files |
| `xml-formatter` | 3.6.4 | XML formatting | WSDL/XML display |

---

## Utilities

| Package | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `lodash` | 4.17.21 | Utility functions | groupBy, etc. |
| `memoizee` | 0.4.17 | Memoization | HTTP caching, spec caching |
| `classnames` | 2.5.1 | CSS class composition | Conditional styling |
| `uuid` | 11.1.0 | UUID generation | Unique IDs |
| `qs` | 6.14.0 | Query string parsing | URL params |
| `eventsource` | 3.0.6 | Server-Sent Events | MCP streaming (TODO: verify usage) |

---

## Build & Development

| Package | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `vite-tsconfig-paths` | 5.1.4 | Path alias support | `@/` imports |
| `@vitejs/plugin-basic-ssl` | 1.2.0 | Local HTTPS | Dev server SSL |
| `sass-embedded` | 1.83.0 | SCSS compilation | Style preprocessing |

---

## Code Quality

| Package | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `eslint` | 9.17.0 | Linting | Code quality |
| `@typescript-eslint/eslint-plugin` | 8.18.1 | TS linting | TypeScript rules |
| `eslint-plugin-react` | 7.37.2 | React linting | React best practices |
| `eslint-plugin-react-hooks` | 5.1.0 | Hooks linting | Hook rules |
| `eslint-plugin-jsx-a11y` | 6.10.2 | Accessibility | WCAG compliance |
| `eslint-plugin-import` | 2.31.0 | Import rules | Import ordering |
| `prettier` | 3.4.2 | Formatting | Code formatting |
| `stylelint` | 16.13.2 | CSS linting | Style quality |
| `stylelint-config-standard-scss` | 14.0.0 | SCSS rules | SCSS best practices |

---

## Critical Dependencies

### Must-Have for Core Functionality
- `react`, `react-dom` - App foundation
- `recoil`, `recoil-nexus` - State management
- `@fluentui/react-components` - UI components
- `react-router-dom` - Navigation
- `@azure/msal-browser` - Authenticated mode

### Can Be Replaced
- `lodash` → Native JS or other utils
- `memoizee` → Custom memoization
- `react-markdown` → Other markdown libraries
- `classnames` → Manual string concatenation

### Optional (Feature-Specific)
- `@microsoft/api-docs-ui` - Only for OpenAPI display
- `client-oauth2` - Only for test console OAuth
- `graphql` - Only for GraphQL APIs
- `xml-formatter` - Only for XML/WSDL specs

---

## Dependency Strategies

### Recoil Nexus Usage
**Purpose**: Access Recoil state outside React components
**Where**: `HttpService.ts` (get auth token, set access denied)
**Pattern**:
```typescript
import { getRecoil, setRecoil } from 'recoil-nexus';
const value = getRecoil(someAtom);
setRecoil(someAtom, newValue);
```

### Memoizee Usage
**Purpose**: Cache HTTP GET requests and spec fetches
**Where**: `HttpService.ts`, `ApiService.ts`
**Pattern**:
```typescript
const makeRequestWithCache = memoizee(makeRequest);
```

### React Query Integration
**Purpose**: Manage server state with caching
**Where**: Custom hooks (`useApi`, `useApis`, etc.)
**Pattern**:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['api', name],
  queryFn: () => ApiService.getApi(name),
});
```

---

## Version Constraints

### Node.js
**Minimum**: 18 (specified in `package.json` engines)
**Reason**: Vite 6.x requires Node 18+

### Browser Compatibility
**Target**: Modern browsers (ES2020+)
**MSAL**: IE11 not supported (MSAL 3.x)

---

## Security Considerations

### Known Vulnerabilities
- Run `npm audit` regularly
- Update `@azure/msal-browser` for security patches
- Monitor `react` and `react-dom` for XSS fixes

### Unsafe Dependencies
- `rehype-raw` - Allows HTML in markdown (XSS risk if untrusted content)
- Mitigated by sanitization in MarkdownRenderer component (TODO: verify)

---

## Dependency Update Strategy

### Breaking Changes to Watch
- **Recoil**: Not yet stable (0.7.x), API may change
- **Fluent UI**: Major versions can break theming
- **React Router**: v6 → v7 migration path
- **Vite**: Major versions change plugin APIs

### Update Cadence
- **Monthly**: Patch versions (security fixes)
- **Quarterly**: Minor versions (features)
- **Annually**: Major versions (breaking changes)

---

## TODO: Dependency Questions

- [ ] Is `eventsource` actually used? (MCP streaming?)
- [ ] Can we remove `util` polyfill? (listed in deps)
- [ ] Is `react-timeago` used anywhere? (found in package.json)
- [ ] Audit `rehype-raw` usage for XSS safety
- [ ] Consider replacing `lodash` with native methods (bundle size)
