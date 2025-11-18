# Components

## Overview

This document catalogs the **atomic components** in the `src/components/` directory and **experience components** in the `src/experiences/` directory. Components follow the Fluent UI design system and use SCSS modules for styling.

---

## Component Architecture

### Component Types

1. **Atomic Components** (`src/components/`): Small, reusable UI elements (buttons, cards, icons, form fields).
2. **Experience Components** (`src/experiences/`): Complex, feature-rich components composed of multiple atomic components (filters panel, test console, API list).
3. **Page Components** (`src/pages/`): Top-level route components that compose experiences.

### Component Structure

**Typical Component Folder**:
```
ComponentName/
  ComponentName.tsx        # Main component code
  ComponentName.module.scss # Scoped styles
  index.ts                 # Re-export for clean imports
```

**Import Pattern**:
```tsx
import { ComponentName } from '@/components/ComponentName';
```

---

## Atomic Components (`src/components/`)

### 1. ApiAuthForm

**Purpose**: Form for entering authentication credentials for HTTP test console (OAuth, API keys).

**Location**: `src/components/ApiAuthForm/`

**Props**:
```typescript
interface ApiAuthFormProps {
  onAuthChange: (auth: AuthConfig) => void;
  initialAuth?: AuthConfig;
}
```

**Key Features**:
- Supports OAuth 2.0 (client credentials, authorization code)
- API key input (header or query param)
- Basic auth (username/password)

**Used In**: `HttpTestConsole` experience.

---

### 2. CopyLink

**Purpose**: Button to copy shareable link (e.g., API detail URL with operation deep link).

**Location**: `src/components/CopyLink/`

**Props**:
```typescript
interface CopyLinkProps {
  url: string;
  label?: string;
}
```

**Behavior**: Copies `url` to clipboard on click, shows toast notification.

**Used In**: `ApiInfoOptions` experience.

---

### 3. CustomMetadata

**Purpose**: Displays custom metadata properties for an API (e.g., team, owner, cost center).

**Location**: `src/components/CustomMetadata/`

**Props**:
```typescript
interface CustomMetadataProps {
  metadata: Record<string, unknown>;
}
```

**Rendering**:
- Iterates over key-value pairs
- Renders as labeled fields (e.g., "Team: Platform")

**Used In**: `ApiDetailsPage`, `ApiCard`.

---

### 4. EmptyStateMessage

**Purpose**: Displays message and icon for empty/error states (no results, access denied, no data).

**Location**: `src/components/EmptyStateMessage/`

**Props**:
```typescript
interface EmptyStateMessageProps {
  icon: 'noResults' | 'accessDenied' | 'semanticSearch';
  title: string;
  description?: string;
}
```

**Assets**: Imports SVG icons from `src/assets/`.

**Used In**: `ApisPage` (no search results), `ApiDetailsPage` (access denied).

---

### 5. Footer

**Purpose**: App footer with version info, links, and copyright.

**Location**: `src/components/Footer/`

**Props**: None (static content).

**Content**:
- Portal version (from `package.json`)
- Links to GitHub repo, docs, support
- Copyright notice

**Used In**: `Layout` component.

---

### 6. Header

**Purpose**: App header with logo, navigation, search, and auth button.

**Location**: `src/components/Header/`

**Props**: None (uses global state).

**Key Features**:
- Logo with link to home
- Navigation links (Home, APIs)
- Search box (if on homepage)
- "Sign In" button (hidden in anonymous mode)
- Profile/avatar (if authenticated, TODO: implement)

**State Dependencies**:
- `isAnonymousAccessEnabledAtom` (hide auth button)
- `isAuthenticatedAtom` (show profile vs sign-in)

**Styling**: `Header.module.scss` with `.navLinks` and `.navLinksNoSeparator` classes.

---

### 7. MarkdownRenderer

**Purpose**: Renders Markdown content (API descriptions, operation summaries).

**Location**: `src/components/MarkdownRenderer/`

**Props**:
```typescript
interface MarkdownRendererProps {
  content: string;
  className?: string;
}
```

**Dependencies**:
- `react-markdown` (parser)
- `remark-gfm` (GitHub-flavored markdown)
- `rehype-raw` (HTML support in markdown)
- `rehype-truncate` (truncate long content)

**Security**: ⚠️ `rehype-raw` allows raw HTML → **XSS risk** if untrusted content. (TODO: Add sanitization with DOMPurify or restrict HTML).

**Used In**: API descriptions, operation details.

---

### 8. ParamSchemaDefinition

**Purpose**: Displays OpenAPI schema for parameters (type, format, required, example).

**Location**: `src/components/ParamSchemaDefinition/`

**Props**:
```typescript
interface ParamSchemaDefinitionProps {
  schema: OpenAPISchema;
  name: string;
  required?: boolean;
}
```

**Rendering**:
- Parameter name (bold if required)
- Type badge (string, integer, boolean, etc.)
- Format (e.g., `date-time`, `uuid`)
- Example value
- Description (markdown)

**Used In**: `HttpTestConsole` (parameter list).

---

### 9. RefLink

**Purpose**: Renders link to referenced schema in OpenAPI spec (e.g., `$ref: "#/components/schemas/Pet"`).

**Location**: `src/components/RefLink/`

**Props**:
```typescript
interface RefLinkProps {
  ref: string; // e.g., "#/components/schemas/Pet"
  onClick: (schemaName: string) => void;
}
```

**Behavior**: Extracts schema name from `$ref`, renders as clickable link, triggers modal or navigation on click.

**Used In**: Schema viewer, operation details.

---

### 10. SemanticSearchToggle

**Purpose**: Toggle switch for enabling semantic search (requires Azure AI Search).

**Location**: `src/components/SemanticSearchToggle/`

**Props**: None (uses Recoil state).

**State**: `isSemanticSearchEnabledAtom` (boolean atom).

**Behavior**:
- Toggle ON → API search uses POST `/:search` with `useSemanticSearch: true`.
- Toggle OFF → Standard text search via GET `/apis?$filter=...`.

**Used In**: `ApiSearchBox`, `ApisPage` filters.

---

### 11. TestConsoleError

**Purpose**: Displays error messages in HTTP test console (network errors, 4xx/5xx responses).

**Location**: `src/components/TestConsoleError/`

**Props**:
```typescript
interface TestConsoleErrorProps {
  error: Error | HttpError;
}
```

**Rendering**:
- Error icon
- Status code (if HTTP error)
- Error message
- Stack trace (collapsed, for debugging)

**Used In**: `HttpTestConsole`, `McpTestConsole`.

---

## Experience Components (`src/experiences/`)

### 1. ActiveFiltersBadges

**Purpose**: Displays currently active filters as removable badges.

**Location**: `src/experiences/ActiveFiltersBadges/`

**Props**: None (reads from `apiSearchFiltersAtom`).

**Behavior**: Clicking "X" removes filter, triggers refetch.

**Used In**: `ApisPage` (above API list).

---

### 2. ApiAccessAuthForm

**Purpose**: Placeholder for API access token form (future feature?).

**Location**: `src/experiences/ApiAccessAuthForm/`

**Status**: TODO: Verify purpose (API key management? Access token for API Center?).

---

### 3. ApiAdditionalInfo

**Purpose**: Displays additional API metadata (tags, external docs, custom properties).

**Location**: `src/experiences/ApiAdditionalInfo/`

**Props**:
```typescript
interface ApiAdditionalInfoProps {
  api: IApi;
}
```

**Sections**:
- Tags (badges)
- External documentation links
- Custom metadata (via `CustomMetadata` component)

**Used In**: `ApiDetailsPage`.

---

### 4. ApiDefinitionSelect

**Purpose**: Dropdown to select API definition (OpenAPI, AsyncAPI, gRPC, etc.).

**Location**: `src/experiences/ApiDefinitionSelect/`

**Props**:
```typescript
interface ApiDefinitionSelectProps {
  apiName: string;
  selectedVersion: string;
  selectedDefinition?: string;
  onSelect: (definitionName: string) => void;
}
```

**Data Source**: `useApiDefinitions(apiName, selectedVersion)` hook.

**Used In**: `ApiDetailsPage`.

---

### 5. ApiFilters

**Purpose**: Filter panel for API list (lifecycle, kind, custom properties).

**Location**: `src/experiences/ApiFilters/`

**Props**: None (uses Recoil state).

**State**: `apiSearchFiltersAtom` (read/write).

**Filters**:
- Lifecycle (design, development, testing, production)
- Kind (REST, GraphQL, gRPC, SOAP)
- Custom properties (dynamic based on `config.apiFilters.customProperties`)

**Used In**: `ApisPage`.

---

### 6. ApiInfoOptions

**Purpose**: Action buttons for API detail page (copy link, open in VS Code).

**Location**: `src/experiences/ApiInfoOptions/`

**Props**:
```typescript
interface ApiInfoOptionsProps {
  api: IApi;
}
```

**Buttons**:
- Copy API detail link (via `CopyLink` component)
- Open in VS Code (hidden if `!config.authentication`)
- Open in VS Code Insiders (hidden if `!config.authentication`)

**State**: `configAtom` (check `authentication` existence).

**Used In**: `ApiDetailsPage`.

---

### 7. ApiList

**Purpose**: Renders list of APIs (grid or list layout).

**Location**: `src/experiences/ApiList/`

**Props**:
```typescript
interface ApiListProps {
  apis: IApi[];
  layout: 'grid' | 'list';
}
```

**Layout State**: `apiListLayoutAtom` (persisted in localStorage).

**Item Component**: `ApiCard` or `ApiListItem` (depending on layout).

**Used In**: `ApisPage`.

---

### 8. ApiListLayoutSwitch

**Purpose**: Toggle button to switch between grid and list layouts.

**Location**: `src/experiences/ApiListLayoutSwitch/`

**Props**: None (uses Recoil state).

**State**: `apiListLayoutAtom` (read/write).

**Used In**: `ApisPage` toolbar.

---

### 9. ApiListSortingSelect

**Purpose**: Dropdown to select sorting order (name A-Z, recently updated, etc.).

**Location**: `src/experiences/ApiListSortingSelect/`

**Props**: None (uses Recoil state).

**State**: `apiListSortingAtom` (read/write).

**Options**:
- Name (A-Z)
- Name (Z-A)
- Recently updated
- Recently created

**Used In**: `ApisPage` toolbar.

---

### 10. ApiOperationDetails

**Purpose**: Displays details for a selected API operation (method, path, description, parameters, responses).

**Location**: `src/experiences/ApiOperationDetails/`

**Props**:
```typescript
interface ApiOperationDetailsProps {
  operation: IOperation; // From spec reader
}
```

**Sections**:
- Method badge + path
- Summary + description (markdown)
- Parameters table (path, query, header, body)
- Responses table (status code, description, schema)

**Used In**: `ApiDetailsPage` (when operation selected).

---

### 11. ApiOperationsSelect

**Purpose**: Dropdown to select API operation (e.g., "GET /pets", "POST /pets/{id}").

**Location**: `src/experiences/ApiOperationsSelect/`

**Props**:
```typescript
interface ApiOperationsSelectProps {
  operations: IOperation[];
  selectedOperation?: string;
  onSelect: (operationId: string) => void;
}
```

**Data Source**: Parsed from API spec via `useApiSpec()`.

**Used In**: `ApiDetailsPage`.

---

### 12. ApiSearchBox

**Purpose**: Search box with autocomplete for finding APIs by name, title, description.

**Location**: `src/experiences/ApiSearchBox/`

**Props**:
```typescript
interface ApiSearchBoxProps {
  onSelect: (api: IApi) => void;
}
```

**Features**:
- Debounced search (300ms)
- Autocomplete suggestions (top 5 results)
- Recent searches (from `recentSearchesAtom`)
- Semantic search toggle (via `SemanticSearchToggle`)

**State**: `recentSearchesAtom` (append on select).

**Used In**: `Header`, `HomePage`.

---

### 13. HttpTestConsole

**Purpose**: Interactive HTTP request form for testing API operations.

**Location**: `src/experiences/HttpTestConsole/`

**Props**:
```typescript
interface HttpTestConsoleProps {
  operation: IOperation;
  deployment?: IDeployment;
}
```

**Sections**:
1. **Request Form**:
   - Parameters (path, query, header)
   - Body editor (JSON, FormData, Text)
   - Auth form (OAuth, API key, Basic)
2. **Send Button**: Triggers fetch to target API.
3. **Response Viewer**:
   - Status code + color
   - Headers table
   - Body (JSON pretty-printed, or raw)

**Key Logic**:
- URL resolution: `deployment.server.url + operation.path` with interpolated path params.
- No HttpService used (direct fetch to external API).

**Used In**: `ApiDetailsPage`.

---

### 14. McpTestConsole

**Purpose**: Interactive MCP (Model Context Protocol) request form for testing MCP servers.

**Location**: `src/experiences/McpTestConsole/`

**Status**: TODO: Verify implementation (MCP streaming, SSE, protocol details).

**Used In**: `ApiDetailsPage` (if API kind = MCP).

---

## Component Patterns

### 1. SCSS Modules

**Pattern**: Every component has `.module.scss` file with scoped class names.

**Usage**:
```tsx
import styles from './Component.module.scss';

<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

**Benefits**: No class name collisions, co-located with component.

### 2. Fluent UI Components

**Pattern**: Use Fluent UI primitives for buttons, inputs, dropdowns, etc.

**Example**:
```tsx
import { Button, Input, Dropdown } from '@fluentui/react-components';

<Button appearance="primary" onClick={handleClick}>
  Submit
</Button>
```

**Theme**: Fluent UI provides default Microsoft theme (colors, typography, spacing).

### 3. Recoil State in Components

**Pattern**: Use `useRecoilValue()` for read-only, `useRecoilState()` for read/write.

**Example**:
```tsx
const filters = useRecoilValue(apiSearchFiltersAtom);
const [layout, setLayout] = useRecoilState(apiListLayoutAtom);
```

**Avoid**: Passing state as props (use atoms for global state).

### 4. Custom Hooks in Components

**Pattern**: Extract data fetching to custom hooks (e.g., `useApis()`, `useApiSpec()`).

**Example**:
```tsx
const { data: apis, isLoading } = useApis({ query, filters });

if (isLoading) return <Spinner />;
return <ApiList apis={apis} />;
```

**Benefits**: Reusable logic, cleaner components.

---

## TODO: Components

- [ ] Verify `McpTestConsole` implementation (MCP protocol details)
- [ ] Verify `ApiAccessAuthForm` purpose (future feature?)
- [ ] Document component prop types (exact interfaces)
- [ ] Verify if `EmptyStateMessage` supports custom icons (beyond 3 defaults)
- [ ] Document `MarkdownRenderer` XSS mitigation (add DOMPurify?)
- [ ] Verify if `Header` shows user profile/avatar when authenticated
- [ ] Document accessibility features (keyboard nav, ARIA labels)
- [ ] Verify if components use Fluent UI theming system
- [ ] Document component testing strategy (unit tests, Storybook?)
- [ ] Verify if any components use React Context (besides Recoil)
