# Agent UI — Design Spec

## Problem

The backend now exposes APIs of `kind: "agent"` plus a dedicated agent endpoint surface
(`/workspaces/{ws}/agents/...`) including versions and a `definition` artifact. The
portal needs:

1. Agent filtering on the home/list page (sidebar filter + category pill).
2. Agent indication in the API list/cards (badge).
3. A detail page modeled after the Skill detail page, additionally surfacing the
   markdown agent definition.

The existing `AgentChat` (chat playground) page is **not** part of this work and will
not be linked from the new UI.

## Approach

Mirror the existing Skill UI patterns exactly where possible. Agents are treated as a
standalone kind (alongside `skill`, `plugin`, `mcp`, etc.). Add a new `AgentInfo` page
that uses `DetailPageLayout`, reuses tab/badge/markdown patterns from `SkillInfo`, and
adds a single new tab for the agent definition that fetches a markdown artifact and
renders it with `MarkdownRenderer`.

### Out of scope

- Parsing the markdown (no YAML frontmatter extraction, no structured-field panel).
- Linking to the chat playground (`AgentChat`) from the new detail page.
- Changes to the search filter dropdown — `kind: agent` already exists in
  `src/config/apiFilters.ts`.
- Changes to `ApiCard` / `ApiList` badge logic — `agent` is already in
  `STANDALONE_KINDS`.

## UI changes

### List page

- `src/experiences/CategoryPills/CategoryPills.tsx`: uncomment the **Agents** pill
  (label `Agents`, kind value `agent`, icon `BotRegular`). No other changes to that
  component.

### Detail page (new): `AgentInfo`

Location: `src/pages/AgentInfo/AgentInfo.tsx` (+ `.module.scss`, `index.ts`).

Modeled on `src/pages/SkillInfo/SkillInfo.tsx`.

**Header (`DetailPageLayout` props):**

- `title`: `api.data.title`
- `summary`: `api.data.summary`
- `metadata`:
  - `<Badge appearance="filled" color="brand" shape="circular">Agent</Badge>`
  - lifecycle stage badge if present
  - "Last updated …" if present
- `headerActions`: none.

**Tabs:**

1. **Documentation** (default) — `MarkdownRenderer` of
   `api.data.description ?? api.data.summary`. Empty state if neither present
   (same copy pattern as `SkillInfo`).
2. **Definition** — see below.
3. **Additional properties** — only when `customProperties` is non-empty; renders
   `<CustomMetadata value={api.data.customProperties} />`. (Same gating as
   `SkillInfo`.)

**Definition tab:**

- A version `<Dropdown>` (Fluent v9) at the top of the tab content. Sourced from
  `useAgentVersions(name)`. Defaults to the first version returned by the API.
- Body: `MarkdownRenderer` rendering the markdown text returned by
  `useAgentDefinition(name, selectedVersion)`.
- A **Download** button (next to the dropdown) that triggers the download
  endpoint for the `definition` artifact of the selected version.
- Loading: spinner while versions or definition are loading.
- Error: standard error message + retry, matching existing patterns
  (`useApi` / `useSkillEvaluationResult` style).
- Empty: if no versions exist, render an `EmptyStateMessage`
  (`No definition available for this agent.`).

### Routing

- `src/App.tsx`: add `{ path: 'agents/:name', element: <AgentInfo /> }`.
- The existing `AgentChat` route registration **remains** unchanged for now (the
  page is unlinked but reachable directly by URL). It can be removed later if
  desired; that cleanup is out of scope here.
- Update link generation everywhere agents are linked to point to the info page:
  - `src/experiences/ApiList/ApiList.tsx` — `if (kind === 'agent') return LocationsService.getAgentInfoUrl(api.name);`
  - `src/experiences/ApiSearchBox/ApiSearchAutoComplete/ApiSearchAutoComplete.tsx` — same.
  - `src/pages/PluginInfo/PluginInfo.tsx` line 41 — same.

> Note on App.tsx routing collision: the new `AgentInfo` route at `agents/:name`
> replaces the previous `AgentChat` registration at the same path. Drop the old
> `<AgentChat />` route entry from `App.tsx`. The component itself stays in the
> tree; it is simply no longer referenced from the router. (Removing the unused
> file is optional cleanup; not in scope.)

## Data layer

### `LocationsService` (`src/services/LocationsService.ts`)

Add:

```ts
getAgentInfoUrl(name: string): string {
  return `/agents/${encodeURIComponent(name)}`;
}
```

Keep `getAgentChatUrl` as-is (still returns `/agents/:name`); it is no longer
called from production code paths but remains for any external consumers. If
keeping both creates confusion, the implementer may collapse them into one — both
return the same path.

### Types (`src/types/agent.ts`, new)

```ts
export interface AgentVersion {
  name: string;
  title?: string;
  lifecycleStage?: string;
}

export interface AgentArtifact {
  name: string;
  contentType?: string;
}
```

(Reusing `ApiVersion` is acceptable if its shape matches the agent versions
response. Implementer to verify against actual API response and choose the
simpler option.)

### `ApiService` additions (`src/services/ApiService.ts` + `IApiService`)

```ts
getAgentVersions(agentName: string): Promise<AgentVersion[]>;
// GET /agents/{agentName}/versions

getAgentDefinition(agentName: string, versionName: string): Promise<string>;
// Fetches /agents/{agentName}/versions/{versionName}/artifacts/definition/download
// and returns the response body as text (markdown).

getAgentDefinitionDownloadUrl(agentName: string, versionName: string): string;
// Returns the absolute URL to the /download endpoint, suitable for a Download button.
```

Implementation follows the existing `getVersions` / `getSpecification` patterns
in `ApiService.ts`. `HttpService` is reused for auth headers.

### Hooks

- `src/hooks/useAgentVersions.ts` — wraps `ApiService.getAgentVersions` with
  React Query, keyed by agent name. Mirrors `useSkillEvaluationResult` /
  `useApi` style.
- `src/hooks/useAgentDefinition.ts` — wraps `ApiService.getAgentDefinition`,
  keyed by `(agentName, versionName)`, only enabled when both are truthy.

### Query keys (`src/constants/QueryKeys.ts`)

Add `AgentVersions`, `AgentDefinition` keys following the existing pattern.

## Testing & verification

- Type-check: `npm run build` (or whatever the project uses for tsc) must pass.
- Lint: `npm run lint` must pass for changed files.
- Manual:
  - Filter chip "Agents" appears and filters the list to `kind: agent`.
  - Cards for agent APIs show the **Agent** brand badge.
  - Navigating to an agent from the list lands on the new `AgentInfo` page
    (not the chat).
  - Documentation tab renders markdown.
  - Definition tab: version dropdown lists versions; selecting one renders the
    markdown definition; Download button downloads the markdown.
  - Additional properties tab appears only when custom props exist.
  - Loading, empty, and error states display sensibly.

If automated tests exist for `SkillInfo` or list links, mirror them for the
agent equivalents.

## Risks / open items

- **Endpoint auth/CORS**: the `/download` endpoint may issue a redirect or
  require the auth header. If a direct anchor download fails, fall back to
  fetching via `HttpService` (with auth) and creating an object URL for the
  download click. Implementer to verify during integration.
- **Version response shape**: assumed compatible with `ApiVersion`. If the
  agent versions response differs materially, define `AgentVersion` properly
  rather than reusing.
- **AgentChat route collision**: removing the old `<AgentChat />` route entry is
  required. If `AgentChat` should be deleted entirely (file + i18n + tests),
  that is a follow-up cleanup task.
