# Routing & Navigation

## Overview

The application uses **React Router DOM v6** (`createBrowserRouter`) for client-side routing. The router is created in `src/App.tsx` after config is fetched. All routes are children of a shared `<Layout />` component. The `basename` is derived from `import.meta.env.BASE_URL`.

---

## Route Map

| Path | Component | Parent | Purpose |
|------|-----------|--------|---------|
| `/` | `Home` | `Layout` | Landing page with search, filters, and API/model catalog |
| `/apis/:id` | `ApiInfo` | `Home` (nested) | Drawer panel for a regular API (versions, definitions, options) |
| `/languageModels/:id` | `ModelInfo` | `Home` (nested) | Drawer panel for a language model (playground link, metadata) |
| `/apis/:apiName/versions/:versionName/definitions/:definitionName` | `ApiSpec` | `Layout` | Spec explorer for regular APIs |
| `/languageModels/:apiName/versions/:versionName/definitions/:definitionName` | `ApiSpec` | `Layout` | Spec explorer for language models |
| `/skills/:name` | `SkillInfo` | `Layout` | Skill detail page |
| `/plugins/:name` | `PluginInfo` | `Layout` | Plugin detail page |
| `/agents/:name` | `AgentChat` | `Layout` | Agent conversational UI |
| `/models/:name/playground` | `ModelPlayground` | `Layout` | Interactive model playground |

### Route Hierarchy (tree view)

```
Layout
├── / ............................................. Home (catalog + search)
│   ├── /apis/:id ................................ ApiInfo drawer (nested outlet)
│   └── /languageModels/:id ...................... ModelInfo drawer (nested outlet)
├── /apis/:apiName/versions/:versionName/definitions/:definitionName .... ApiSpec
├── /languageModels/:apiName/versions/:versionName/definitions/:definitionName .... ApiSpec
├── /skills/:name ................................ SkillInfo
├── /plugins/:name ............................... PluginInfo
├── /agents/:name ................................ AgentChat
└── /models/:name/playground ..................... ModelPlayground
```

---

## Route Details

### Home (`/`)

- **Component**: `src/pages/Home/Home.tsx`
- **Purpose**: Landing page showing the combined API catalog (APIs, models, skills, plugins, agents) with search, category pills, filters, sorting, and layout toggle.
- **Nested routes**: `apis/:id` and `languageModels/:id` render as side-drawer overlays within the Home page via `<Outlet />`.
- **Query params**:
  - `search` — text search query
  - `ai-search` — `"true"` enables semantic/vector search

### ApiInfo (`/apis/:id`)

- **Component**: `src/pages/ApiInfo/ApiInfo.tsx`
- **Purpose**: Side drawer showing details for a regular API (non-model, non-skill, non-agent). Includes version/definition/deployment selectors, API options (download spec, open in VS Code, view documentation link), and additional metadata.
- **Route param**: `:id` — API name
- **Nuances**: Rendered as a child of `Home`, so the catalog list remains visible behind the drawer. The URL preserves existing search params (search query, filters) so closing the drawer returns to the same catalog state. This nested route does not conflict with the sibling spec route (`/apis/:apiName/versions/…`) because React Router matches the more specific multi-segment path first.

### ModelInfo (`/languageModels/:id`)

- **Component**: `src/pages/ModelInfo/ModelInfo.tsx`
- **Purpose**: Side drawer showing language model details — provider, model name, context window, task/input/output types, playground link, contacts, and documentation.
- **Route param**: `:id` — language model name
- **Nuances**: Same nested-drawer pattern as `ApiInfo`. The playground button navigates to `/models/:name/playground`. Does not show version/definition selectors (models use `LanguageModelService` not `ApiService`). This nested route does not conflict with the sibling spec route (`/languageModels/:apiName/versions/…`) because React Router matches the more specific multi-segment path first.

### ApiSpec — APIs (`/apis/:apiName/versions/:versionName/definitions/:definitionName`)

- **Component**: `src/pages/ApiSpec/ApiSpec.tsx`
- **Purpose**: Full-page specification explorer. Renders either `DefaultApiSpecPage` (OpenAPI/Swagger viewer) or `McpSpecPage` (MCP tool viewer) based on `api.kind`.
- **Route params**: `:apiName`, `:versionName`, `:definitionName`
- **Backend calls**: Uses `resourceType = 'apis'` — all data-plane requests hit `/apis/{name}/versions/…`.
- **Nuance**: The version dropdown triggers in-place URL replacement via `navigate(url, { replace: true })`.

### ApiSpec — Language Models (`/languageModels/:apiName/versions/:versionName/definitions/:definitionName`)

- **Component**: `src/pages/ApiSpec/ApiSpec.tsx` (same component as above)
- **Purpose**: Spec explorer for language model definitions.
- **Route params**: Same as above.
- **Backend calls**: Uses `resourceType = 'languageModels'` — requests hit `/languageModels/{name}/versions/…`.
- **Detection**: `ApiSpec` reads `location.pathname` to determine `resourceType`:
  ```ts
  const resourceType: ResourceType = location.pathname.startsWith('/languageModels')
    ? 'languageModels'
    : 'apis';
  ```
- **Nuance**: The `resourceType` is threaded into `definitionId`, hooks (`useApi`, `useApiVersions`, etc.), and `ApiDefinitionSelect` so the correct data-plane collection is called.

### SkillInfo (`/skills/:name`)

- **Component**: `src/pages/SkillInfo/SkillInfo.tsx`
- **Purpose**: Full-page detail view for a skill-type API.
- **Route param**: `:name`

### PluginInfo (`/plugins/:name`)

- **Component**: `src/pages/PluginInfo/PluginInfo.tsx`
- **Purpose**: Full-page detail view for a plugin-type API.
- **Route param**: `:name`

### AgentChat (`/agents/:name`)

- **Component**: `src/pages/AgentChat/AgentChat.tsx`
- **Purpose**: Conversational chat UI for an agent-type API.
- **Route param**: `:name`

### ModelPlayground (`/models/:name/playground`)

- **Component**: `src/pages/ModelPlayground/ModelPlayground.tsx`
- **Purpose**: Interactive playground for sending messages to a language model and viewing responses.
- **Route param**: `:name`

---

## URL Construction — LocationsService

All internal URL construction is centralized in `src/services/LocationsService.ts`. Components should use these helpers instead of building paths manually.

| Method | Returns | Notes |
|--------|---------|-------|
| `getHomeUrl(preserveSearchParams?)` | `/` or `/?…` | Preserves search/filter params when `true` |
| `getApiSearchUrl(search?, isSemanticSearch?)` | `/?search=…&ai-search=…` | Merges with current window search params |
| `getApiInfoUrl(name)` | `/apis/{name}?…` | Appends current search params |
| `getModelInfoUrl(name)` | `/languageModels/{name}?…` | Appends current search params |
| `getSkillInfoUrl(name)` | `/skills/{name}` | |
| `getPluginInfoUrl(name)` | `/plugins/{name}` | |
| `getAgentChatUrl(name)` | `/agents/{name}` | |
| `getModelPlaygroundUrl(name)` | `/models/{name}/playground` | |
| `getApiSchemaExplorerUrl(api, version, definition, resourceType?)` | `/{resourceType}/{api}/versions/{version}/definitions/{definition}` | Defaults `resourceType` to `'apis'`. Pass `'languageModels'` for models. Use `kindToResourceType(api.kind)` to derive from an API's kind. |
| `getAiSearchInfoUrl()` | External docs link | |
| `getHelpUrl()` | External docs link | |

### ResourceType and kindToResourceType

The `ResourceType` type (`'apis' | 'languageModels'`) controls the URL prefix used for both **UI routes** and **data-plane API calls**. The helper `kindToResourceType(kind)` in `src/types/apiDefinition.ts` maps an API's `kind` field to the correct value:

- `'languageModel'` → `'languageModels'`
- Everything else → `'apis'`

---

## Navigation Patterns

### Catalog → Detail Drawers

Clicking an item in the API list navigates based on its `kind` (via `apiAdapter` which maps `kind` → `type`):

| `type` value | Target URL | Source |
|---|---|---|
| `'agent'` | `/agents/{name}` | `getAgentChatUrl` |
| `'skill'` | `/skills/{name}` | `getSkillInfoUrl` |
| `'plugin'` | `/plugins/{name}` | `getPluginInfoUrl` |
| `'languageModel'` | `/languageModels/{name}` | `getModelInfoUrl` |
| anything else | `/apis/{name}` | `getApiInfoUrl` |

This logic lives in `ApiList.tsx` → `apiLinkPropsProvider`.

### Detail Drawer → Spec Explorer

From the `ApiInfo` drawer, the "View documentation" link navigates to the spec explorer using `getApiSchemaExplorerUrl(api.name, version, definition, kindToResourceType(api.kind))`. This ensures language models use `/languageModels/…` and regular APIs use `/apis/…`.

### Spec Explorer Version Switching

When the user selects a different version/definition inside `ApiSpec`, the URL updates in-place via `navigate(url, { replace: true })` so the version change doesn't create a new history entry.

---

## Query Parameters

Defined in `src/constants/urlParams.ts`:

| Key | Constant | Used On | Purpose |
|-----|----------|---------|---------|
| `search` | `UrlParams.SEARCH_QUERY` | `/` | Text search query |
| `ai-search` | `UrlParams.IS_SEMANTIC_SEARCH` | `/` | `"true"` for vector/semantic search |

The `/apis/:id` and `/languageModels/:id` routes inherit the parent `/` search params so closing the drawer restores the catalog state.

---

## Navigation State Persistence

| State | Atom | Persistence | Scope |
|-------|------|-------------|-------|
| Recent searches | `recentSearchesAtom` | localStorage | Homepage search suggestions |
| Search filters | `apiSearchFiltersAtom` | Session-only | Active catalog filters |
| Layout preference | `apiListLayoutAtom` | localStorage | Grid vs. list toggle |
| Sorting | `apiListSortingAtom` | Session-only | Catalog sort order |

---

## Authentication & Access

There are no route guards. Authentication state (`isAuthenticatedAtom`) is checked at the data-fetching layer — hooks like `useApi`, `useApis`, etc. only fire queries when `isAuthenticated` is true. If the user is not authenticated and anonymous access is disabled, the UI shows an access-denied state rather than redirecting.
- [ ] Document scroll restoration strategy (scroll to top on navigation?)
- [ ] Verify if route-based code splitting implemented
- [ ] Document deep link validation logic (invalid operation ID handling)
- [ ] Verify if programmatic navigation uses `replace` vs `push` strategically
- [ ] Document navigation analytics events (if any)
- [ ] Verify if `useLocation()` used for tracking current route
