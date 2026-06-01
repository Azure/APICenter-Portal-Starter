# Skill & Agent Contract Alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify skill and agent data-fetching behind a shared `AIAsset` abstraction so skills gain versioned endpoints, a version selector, and a definition tab — matching agents.

**Architecture:** Replace agent-specific hooks, service methods, and types with `AIAsset`-prefixed equivalents parameterized by `resourceType: 'agents' | 'skills'`. Keep AgentInfo and SkillInfo as separate page components that compose the shared data layer with page-specific UI. MCP server pages are untouched.

**Tech Stack:** React 18, TypeScript, React Query, Recoil, Fluent UI v9, Vite

**Pre-existing issues:** `src/utils/openApi.tsx` has 5 TS errors unrelated to this work — ignore them when validating the build.

**Migration strategy:** Additive-first — create all new files/methods alongside old ones, then update consumers, then delete old files. This ensures every intermediate commit compiles.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/types/aiAsset.ts` | `AIAssetResourceType` union, `AIAssetVersion` interface |
| Edit | `src/types/evaluation.ts` | Add `versionName` to `SkillEvaluationResult` |
| Edit | `src/constants/QueryKeys.ts` | Add 3 `AIAsset` keys (keep old keys temporarily) |
| Edit | `src/types/services/IApiService.ts` | Add 3 new `AIAsset` methods (keep old methods temporarily) |
| Edit | `src/services/ApiService.ts` | Implement the 3 new parameterized service methods (keep old temporarily) |
| Create | `src/hooks/useAIAssetVersions.ts` | Shared version-fetching hook |
| Create | `src/hooks/useAIAssetDefinition.ts` | Shared definition-fetching hook |
| Create | `src/hooks/useAIAssetEvaluationResult.ts` | Shared eval-result hook (merges agent + skill) |
| Create | `src/experiences/AIAssetDefinition/` | Renamed component (copy from AgentDefinition) |
| Edit | `src/pages/AgentInfo/AgentInfo.tsx` | Swap imports to `AIAsset` variants |
| Edit | `src/pages/SkillInfo/SkillInfo.tsx` | Add VersionSelect, Definition tab, versioned eval |
| Delete | `src/types/agent.ts` | Replaced by `aiAsset.ts` |
| Delete | `src/hooks/useAgentVersions.ts` | Replaced by `useAIAssetVersions` |
| Delete | `src/hooks/useAgentDefinition.ts` | Replaced by `useAIAssetDefinition` |
| Delete | `src/hooks/useAgentEvaluationResult.ts` | Replaced by `useAIAssetEvaluationResult` |
| Delete | `src/hooks/useSkillEvaluationResult.ts` | Replaced by `useAIAssetEvaluationResult` |
| Delete | `src/experiences/AgentDefinition/` | Replaced by `AIAssetDefinition` |
| Edit | `src/constants/QueryKeys.ts` | Remove old agent/skill keys |
| Edit | `src/types/services/IApiService.ts` | Remove old agent/skill methods |
| Edit | `src/services/ApiService.ts` | Remove old agent/skill methods |

---

### Task 1: Add new types and update evaluation model

**Files:**
- Create: `src/types/aiAsset.ts`
- Edit: `src/types/evaluation.ts`

- [ ] **Step 1: Create `src/types/aiAsset.ts`**

```typescript
/**
 * Shared type definitions for AI asset kinds (agents, skills) in Azure API Center.
 *
 * These assets expose versioned definitions through dedicated endpoints
 * under /{resourceType}/{name}. The definition artifact is markdown.
 */

export type AIAssetResourceType = 'agents' | 'skills';

export interface AIAssetVersion {
  name: string;
  title?: string;
  lifecycleStage?: string;
}
```

- [ ] **Step 2: Update `src/types/evaluation.ts` — add `versionName` to `SkillEvaluationResult`**

The backend PR 15909449 adds `versionName` to the skill eval result contract. Change lines 54-56 from:

```typescript
export interface SkillEvaluationResult extends EvaluationResult {
  skillName: string;
}
```

to:

```typescript
export interface SkillEvaluationResult extends EvaluationResult {
  skillName: string;
  versionName?: string;
}
```

- [ ] **Step 3: Verify build still passes**

Run: `npx tsc --noEmit 2>&1 | Select-String -NotMatch "openApi.tsx"`

Expected: No new errors. The old `src/types/agent.ts` still exists at this point, so all existing imports work.

- [ ] **Step 4: Commit**

```bash
git add src/types/aiAsset.ts src/types/evaluation.ts
git commit -m "feat: add shared AIAssetVersion type and version field to SkillEvaluationResult"
```

---

### Task 2: Add new QueryKeys, service methods, and hooks (additive)

**Files:**
- Edit: `src/constants/QueryKeys.ts`
- Edit: `src/types/services/IApiService.ts`
- Edit: `src/services/ApiService.ts`
- Create: `src/hooks/useAIAssetVersions.ts`
- Create: `src/hooks/useAIAssetDefinition.ts`
- Create: `src/hooks/useAIAssetEvaluationResult.ts`

- [ ] **Step 1: Add new keys to QueryKeys (keep old ones)**

In `src/constants/QueryKeys.ts`, add three new entries to the enum. The old keys stay for now:

```typescript
export enum QueryKeys {
  Apis = 'Apis',
  Api = 'Api',
  AgentVersions = 'AgentVersions',
  AgentDefinition = 'AgentDefinition',
  AIAssetVersions = 'AIAssetVersions',
  AIAssetDefinition = 'AIAssetDefinition',
  AIAssetEvaluationResult = 'AIAssetEvaluationResult',
  Server = 'Server',
  ApiVersions = 'ApiVersions',
  ApiDefinitions = 'ApiDefinitions',
  ApiDefinition = 'ApiDefinition',
  ApiDeployments = 'ApiDeployments',
  ApiDeploymentEnvironment = 'ApiDeploymentEnvironment',
  ApiSpec = 'ApiSpec',
  ApiSpecUrl = 'ApiSpecUrl',
  ApiAuthScheme = 'ApiAuthScheme',
  ApiAuthSchemeOptions = 'ApiAuthSchemeOptions',
  HttpTestMutation = 'HttpTestMutation',
  MetadataSchemas = 'MetadataSchemas',
  Plugin = 'Plugin',
  LanguageModel = 'LanguageModel',
  SkillEvaluationResult = 'SkillEvaluationResult',
  AgentEvaluationResult = 'AgentEvaluationResult',
}
```

- [ ] **Step 2: Add new methods to `IApiService` (keep old ones)**

In `src/types/services/IApiService.ts`, add import after the existing `AgentVersion` import:

```typescript
import { AIAssetResourceType, AIAssetVersion } from '@/types/aiAsset';
```

Add 3 new methods at the end of the interface (before the closing brace), after the existing `getAgentDefinition`:

```typescript
  getAIAssetVersions(name: string, resourceType: AIAssetResourceType): Promise<AIAssetVersion[]>;
  getAIAssetDefinition(name: string, versionName: string, resourceType: AIAssetResourceType): Promise<string | undefined>;
  getAIAssetEvaluationResult(
    name: string,
    versionName: string,
    resourceType: AIAssetResourceType
  ): Promise<SkillEvaluationResult | AgentEvaluationResult | undefined>;
```

- [ ] **Step 3: Implement new methods in `ApiService` (keep old ones)**

In `src/services/ApiService.ts`, add import after the existing `AgentVersion` import:

```typescript
import { AIAssetResourceType, AIAssetVersion } from '@/types/aiAsset';
```

Add 3 new methods at the end of the object (before the closing `};`), after the existing `getAgentDefinition`:

```typescript
  async getAIAssetVersions(name: string, resourceType: AIAssetResourceType): Promise<AIAssetVersion[]> {
    const response = await HttpService.get<{ value: AIAssetVersion[] }>(
      `/${resourceType}/${encodeURIComponent(name)}/versions?$top=${DEFAULT_PAGE_SIZE}`
    );
    return response?.value || [];
  },

  async getAIAssetDefinition(
    name: string,
    versionName: string,
    resourceType: AIAssetResourceType
  ): Promise<string | undefined> {
    return await HttpService.getText(
      `/${resourceType}/${encodeURIComponent(name)}/versions/${encodeURIComponent(versionName)}/artifacts/definition/download`
    );
  },

  async getAIAssetEvaluationResult(
    name: string,
    versionName: string,
    resourceType: AIAssetResourceType
  ): Promise<SkillEvaluationResult | AgentEvaluationResult | undefined> {
    return await HttpService.getOptional<SkillEvaluationResult | AgentEvaluationResult>(
      `/${resourceType}/${encodeURIComponent(name)}/versions/${encodeURIComponent(versionName)}/evaluationResults/default`
    );
  },
```

- [ ] **Step 4: Create `src/hooks/useAIAssetVersions.ts`**

```typescript
import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { AIAssetResourceType, AIAssetVersion } from '@/types/aiAsset';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useAIAssetVersions(name: string | undefined, resourceType: AIAssetResourceType) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<AIAssetVersion[]>({
    queryKey: [QueryKeys.AIAssetVersions, resourceType, name],
    queryFn: () => ApiService.getAIAssetVersions(name!, resourceType),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && name),
  });
}
```

- [ ] **Step 5: Create `src/hooks/useAIAssetDefinition.ts`**

```typescript
import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { AIAssetResourceType } from '@/types/aiAsset';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';

export function useAIAssetDefinition(
  name: string | undefined,
  versionName: string | undefined,
  resourceType: AIAssetResourceType
) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<string | undefined>({
    queryKey: [QueryKeys.AIAssetDefinition, resourceType, name, versionName],
    queryFn: () => ApiService.getAIAssetDefinition(name!, versionName!, resourceType),
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && name && versionName),
  });
}
```

- [ ] **Step 6: Create `src/hooks/useAIAssetEvaluationResult.ts`**

```typescript
import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { AIAssetResourceType } from '@/types/aiAsset';
import { SkillEvaluationResult, AgentEvaluationResult } from '@/types/evaluation';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { getMockEvalResult } from '@/mocks/skillEvaluationMocks';
import { getMockAgentEvalResult } from '@/mocks/agentEvaluationMocks';

export function useAIAssetEvaluationResult(
  name: string | undefined,
  versionName: string | undefined,
  resourceType: AIAssetResourceType
) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<SkillEvaluationResult | AgentEvaluationResult | undefined>({
    queryKey: [QueryKeys.AIAssetEvaluationResult, resourceType, name, versionName],
    queryFn: async () => {
      const result = await ApiService.getAIAssetEvaluationResult(name!, versionName!, resourceType);
      // DEV FALLBACK: use mock data when backend returns nothing.
      // Remove this fallback when real evaluation data is available.
      if (!result && import.meta.env.DEV) {
        return resourceType === 'skills'
          ? getMockEvalResult(name!)
          : getMockAgentEvalResult(name!);
      }
      return result;
    },
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && name && versionName),
  });
}
```

- [ ] **Step 7: Verify build still passes**

Run: `npx tsc --noEmit 2>&1 | Select-String -NotMatch "openApi.tsx"`

Expected: No new errors. Both old and new code coexist.

- [ ] **Step 8: Commit**

```bash
git add src/constants/QueryKeys.ts src/types/services/IApiService.ts src/services/ApiService.ts
git add src/hooks/useAIAssetVersions.ts src/hooks/useAIAssetDefinition.ts src/hooks/useAIAssetEvaluationResult.ts
git commit -m "feat: add AIAsset service methods, query keys, and hooks (additive)"
```

---

### Task 3: Create `AIAssetDefinition` experience component

**Files:**
- Create: `src/experiences/AIAssetDefinition/AIAssetDefinition.tsx`
- Create: `src/experiences/AIAssetDefinition/AIAssetDefinition.module.scss`
- Create: `src/experiences/AIAssetDefinition/index.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir src/experiences/AIAssetDefinition
```

- [ ] **Step 2: Create `src/experiences/AIAssetDefinition/AIAssetDefinition.module.scss`**

Copy verbatim from `src/experiences/AgentDefinition/AgentDefinition.module.scss` (all 124 lines):

```scss
.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.markdown {
  line-height: 1.5;

  :global {
    p,
    ul,
    ol {
      margin-top: 0;
      margin-bottom: 0.5em;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 1em;
      margin-bottom: 0.4em;
    }

    ul,
    ol {
      padding-left: 1.5em;
    }

    li {
      margin-bottom: 0.15em;
    }

    code {
      padding: 2px 6px;
      border-radius: 4px;
      background-color: var(--colorNeutralBackground3);
      font-size: 0.85em;
    }

    pre {
      padding: 12px;
      overflow-x: auto;
      border-radius: 6px;
      background-color: var(--colorNeutralBackground3);

      code {
        padding: 0;
        background: none;
      }
    }
  }
}

.errorBar {
  margin-bottom: 8px;
}

.frontmatterTable {
  width: 100%;
  margin-bottom: 16px;
  overflow: hidden;
  border-spacing: 0;
  border: 1px solid var(--colorNeutralStroke2);
  border-radius: 6px;

  th,
  td {
    padding: 6px 13px;
    border-top: 1px solid var(--colorNeutralStroke2);
    text-align: left;
    vertical-align: top;
  }

  th {
    width: 1%;
    background-color: var(--colorNeutralBackground2);
    font-weight: 600;
    white-space: nowrap;
  }

  tr:first-child {
    th,
    td {
      border-top: none;
    }
  }

  tr:nth-child(even) td {
    background-color: var(--colorNeutralBackground2);
  }
}

.tagList {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--colorNeutralBackground3);
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.85em;
}

.codeBlock {
  margin: 0;
  padding: 8px;
  overflow-x: auto;
  border-radius: 4px;
  background-color: var(--colorNeutralBackground3);
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.85em;
}

.emptyValue {
  color: var(--colorNeutralForeground3);
}
```

- [ ] **Step 3: Create `src/experiences/AIAssetDefinition/AIAssetDefinition.tsx`**

```typescript
import React, { useMemo } from 'react';
import { Spinner } from '@fluentui/react-components';
import * as yaml from 'yaml';
import { UseQueryResult } from '@tanstack/react-query';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import styles from './AIAssetDefinition.module.scss';

interface Props {
  definition: UseQueryResult<string | undefined>;
  hasVersion: boolean;
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

interface ParsedDefinition {
  frontmatter?: Record<string, unknown>;
  body: string;
}

function parseDefinition(markdown: string): ParsedDefinition {
  const match = markdown.match(FRONTMATTER_REGEX);
  if (!match) {
    return { body: markdown };
  }

  try {
    const parsed = yaml.parse(match[1]);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { frontmatter: parsed as Record<string, unknown>, body: markdown.slice(match[0].length) };
    }
  } catch {
    // Fall through and render the original markdown as-is.
  }

  return { body: markdown };
}

function formatFrontmatterValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className={styles.emptyValue}>—</span>;
  }
  if (Array.isArray(value)) {
    if (!value.length) return <span className={styles.emptyValue}>—</span>;
    return (
      <div className={styles.tagList}>
        {value.map((item, i) => (
          <code key={i} className={styles.tag}>
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </code>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return <pre className={styles.codeBlock}>{JSON.stringify(value, null, 2)}</pre>;
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return <code className={styles.tag}>{String(value)}</code>;
  }
  return String(value);
}

function renderFrontmatterTable(data: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(data);
  if (!entries.length) return null;

  return (
    <table className={styles.frontmatterTable}>
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key}>
            <th scope="row">{key}</th>
            <td>{formatFrontmatterValue(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const AIAssetDefinition: React.FC<Props> = ({ definition, hasVersion }) => {
  const parsed = useMemo<ParsedDefinition | undefined>(
    () => (definition.data ? parseDefinition(definition.data) : undefined),
    [definition.data]
  );

  if (!hasVersion) {
    return <EmptyStateMessage>No definition available.</EmptyStateMessage>;
  }

  if (definition.isLoading) {
    return <Spinner size="small" label="Loading definition..." />;
  }

  if (definition.isError) {
    return <EmptyStateMessage>No definition has been published for this version yet.</EmptyStateMessage>;
  }

  if (!parsed) {
    return <EmptyStateMessage>This version has no definition.</EmptyStateMessage>;
  }

  return (
    <div className={styles.container}>
      {parsed.frontmatter && renderFrontmatterTable(parsed.frontmatter)}
      {parsed.body.trim() ? (
        <div className={styles.markdown}>
          <MarkdownRenderer markdown={parsed.body} />
        </div>
      ) : (
        !parsed.frontmatter && <EmptyStateMessage>This version has no definition.</EmptyStateMessage>
      )}
    </div>
  );
};

export default React.memo(AIAssetDefinition);
```

Note: Empty-state messages generalized from "agent" to asset-neutral wording.

- [ ] **Step 4: Create `src/experiences/AIAssetDefinition/index.ts`**

```typescript
export { AIAssetDefinition } from './AIAssetDefinition';
export { default } from './AIAssetDefinition';
```

- [ ] **Step 5: Commit**

```bash
git add src/experiences/AIAssetDefinition/
git commit -m "feat: add AIAssetDefinition component (copy of AgentDefinition with generic wording)"
```

---

### Task 4: Update AgentInfo page to use new shared code

**Files:**
- Edit: `src/pages/AgentInfo/AgentInfo.tsx`

- [ ] **Step 1: Replace imports**

Replace lines 6-8:

```typescript
import { useAgentVersions } from '@/hooks/useAgentVersions';
import { useAgentDefinition } from '@/hooks/useAgentDefinition';
import { useAgentEvaluationResult } from '@/hooks/useAgentEvaluationResult';
```

with:

```typescript
import { useAIAssetVersions } from '@/hooks/useAIAssetVersions';
import { useAIAssetDefinition } from '@/hooks/useAIAssetDefinition';
import { useAIAssetEvaluationResult } from '@/hooks/useAIAssetEvaluationResult';
```

Replace line 18:

```typescript
import { AgentDefinition } from '@/experiences/AgentDefinition';
```

with:

```typescript
import { AIAssetDefinition } from '@/experiences/AIAssetDefinition';
```

- [ ] **Step 2: Replace hook calls**

Replace line 27:

```typescript
  const versions = useAgentVersions(api.data?.name);
```

with:

```typescript
  const versions = useAIAssetVersions(api.data?.name, 'agents');
```

Replace line 53:

```typescript
  const definition = useAgentDefinition(api.data?.name, selectedVersion);
```

with:

```typescript
  const definition = useAIAssetDefinition(api.data?.name, selectedVersion, 'agents');
```

Replace line 54:

```typescript
  const evalResult = useAgentEvaluationResult(api.data?.name, selectedVersion);
```

with:

```typescript
  const evalResult = useAIAssetEvaluationResult(api.data?.name, selectedVersion, 'agents');
```

- [ ] **Step 3: Replace component reference**

Replace line 176:

```typescript
        <AgentDefinition definition={definition} hasVersion={!!selectedVersion} />
```

with:

```typescript
        <AIAssetDefinition definition={definition} hasVersion={!!selectedVersion} />
```

- [ ] **Step 4: Verify build still passes**

Run: `npx tsc --noEmit 2>&1 | Select-String -NotMatch "openApi.tsx"`

Expected: No new errors. AgentInfo now uses new code, old code still exists but is unused.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AgentInfo/AgentInfo.tsx
git commit -m "refactor: update AgentInfo to use shared AIAsset hooks and components"
```

---

### Task 5: Update SkillInfo page

**Files:**
- Edit: `src/pages/SkillInfo/SkillInfo.tsx`

This is the largest change. The skill page gains: version state, `VersionSelect`, `Definition` tab, definition download button, and versioned eval.

- [ ] **Step 1: Replace the entire `SkillInfo.tsx`**

Replace the full contents of `src/pages/SkillInfo/SkillInfo.tsx` with:

```typescript
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Tab, TabList } from '@fluentui/react-components';
import { ArrowDownloadRegular, CodeRegular, DocumentRegular } from '@fluentui/react-icons';
import { useRecoilValue } from 'recoil';
import { useApi } from '@/hooks/useApi';
import { useAIAssetVersions } from '@/hooks/useAIAssetVersions';
import { useAIAssetDefinition } from '@/hooks/useAIAssetDefinition';
import { useAIAssetEvaluationResult } from '@/hooks/useAIAssetEvaluationResult';
import { getEvalScore } from '@/types/evaluation';
import { configAtom } from '@/atoms/configAtom';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout, BreadcrumbItem } from '@/components/DetailPageLayout/DetailPageLayout';
import { HeaderActions } from '@/experiences/HeaderActions';
import { VersionSelect } from '@/experiences/VersionSelect';
import { AIAssetDefinition } from '@/experiences/AIAssetDefinition';
import { EvaluationDetails } from '@/experiences/EvaluationDetails';
import { buildSkillDeeplink } from '@/utils/skillDeeplink';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CustomMetadata from '@/components/CustomMetadata';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import { InstallationBlock } from '@/components/InstallationBlock';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';

/** Hardcoded source URL for skill installation deeplinks. */
const SKILL_SOURCE_URL = 'https://github.com/vercel-labs/agent-skills/tree/main/skills';

/** Skill-specific descriptions for known L0/L1 assertion names. */
const SKILL_ASSERTION_DESCRIPTIONS: Record<string, string> = {
  'frontmatter-present': 'Verifies that the SKILL.md file begins with a valid YAML frontmatter block.',
  'has-name': 'Checks that the frontmatter declares a skill name.',
  'has-description': 'Checks that the frontmatter includes a description field.',
  'body-not-empty': 'Ensures the SKILL.md body contains meaningful content beyond the frontmatter.',
  'has-instructions-section': 'Verifies that the skill file contains an explicit instructions section.',
  'has-examples-section': 'Checks for an examples section demonstrating usage patterns.',
  'has-error-handling-section': 'Checks for a section describing error handling and edge cases.',
};

type SkillTab = 'documentation' | 'definition' | 'assessment' | 'properties';

export const SkillInfo: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const api = useApi(name);
  const config = useRecoilValue(configAtom);
  const versions = useAIAssetVersions(api.data?.name, 'skills');
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>();
  const [selectedTab, setSelectedTab] = useState<SkillTab>('documentation');

  setDocumentTitle(`Skill${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [
    { label: 'Home', href: '/' },
    { label: 'Skills', href: '/?kind=skill' },
    { label: api.data?.title || name || '...' },
  ], [api.data?.title, name]);

  const skillSourceUrl = useMemo(
    () => (api.data?.customProperties?.['sourceUrl'] as string | undefined) ?? SKILL_SOURCE_URL,
    [api.data]
  );

  // Auto-select the first version once versions load.
  useEffect(() => {
    if (!selectedVersion && versions.data && versions.data.length > 0) {
      setSelectedVersion(versions.data[0].name);
    }
  }, [versions.data, selectedVersion]);

  // Reset selected version when navigating to a different skill.
  useEffect(() => {
    setSelectedVersion(undefined);
  }, [name]);

  const definition = useAIAssetDefinition(api.data?.name, selectedVersion, 'skills');
  const evalResult = useAIAssetEvaluationResult(api.data?.name, selectedVersion, 'skills');

  // Fall back to documentation tab if assessment data disappears after version change.
  useEffect(() => {
    if (selectedTab === 'assessment' && evalResult.isFetched && !evalResult.isFetching && !evalResult.data) {
      setSelectedTab('documentation');
    }
  }, [selectedTab, evalResult.isFetched, evalResult.isFetching, evalResult.data]);

  const handleSkillInstall = useCallback(() => {
    if (!api.data?.name) return;
    const deeplink = buildSkillDeeplink({ sourceUrl: skillSourceUrl, name: api.data.name }, 'vscode');
    window.open(deeplink);
  }, [skillSourceUrl, api.data?.name]);

  const handleDownload = useCallback(() => {
    if (!api.data?.name || !selectedVersion || !definition.data) return;
    const blob = new Blob([definition.data], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${api.data.name}-${selectedVersion}-definition.md`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }, [api.data?.name, selectedVersion, definition.data]);

  const versionOptions = useMemo(() => versions.data ?? [], [versions.data]);
  const hasCustomProps = !!Object.keys(api.data?.customProperties || {}).length;
  const hasDefinition = !!definition.data;
  const canInstall = !!skillSourceUrl;
  const hasHeaderActions = canInstall || hasDefinition;

  const headerSelector =
    versionOptions.length > 0 ? (
      <VersionSelect
        id="skill-version-select"
        versions={versionOptions}
        selectedName={selectedVersion}
        placeholder="Select skill version"
        isInline
        onChange={setSelectedVersion}
      />
    ) : undefined;

  return (
    <DetailPageLayout
      title={api.data?.title}
      summary={api.data?.summary}
      breadcrumbs={breadcrumbs}
      metadata={
        <Badge appearance="filled" color="brand" shape="circular">Skill</Badge>
      }
      lastUpdated={api.data?.lastUpdated}
      selector={headerSelector}
      tabs={
        <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as SkillTab)}>
          <Tab icon={<DocumentRegular />} value="documentation">Documentation</Tab>
          <Tab icon={<CodeRegular />} value="definition">Definition</Tab>
          {evalResult.data && (() => {
            const { overallScore, maxScore } = getEvalScore(evalResult.data);
            return (
              <Tab value="assessment">
                Assessment
                {maxScore > 0 && (
                  <Badge
                    appearance="filled"
                    color={
                      (overallScore / maxScore) >= 0.8 ? 'success'
                      : (overallScore / maxScore) >= 0.6 ? 'warning'
                      : 'danger'
                    }
                    shape="circular"
                    style={{ marginLeft: 8 }}
                  >
                    {((overallScore / maxScore) * 5).toFixed(1)}/5
                  </Badge>
                )}
              </Tab>
            );
          })()}
          {hasCustomProps && <Tab value="properties">Additional properties</Tab>}
        </TabList>
      }
      headerActions={
        hasHeaderActions ? (
          <HeaderActions showExtensionHint>
            {canInstall && (
              <Button
                icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
                onClick={handleSkillInstall}
              >
                Install in VS Code
              </Button>
            )}
            {hasDefinition && (
              <Button icon={<ArrowDownloadRegular />} onClick={handleDownload}>
                Download definition
              </Button>
            )}
          </HeaderActions>
        ) : undefined
      }
      isLoading={api.isLoading}
      error={api.isError ? 'Failed to load skill details. Please check your connection and try again.' : undefined}
      onRetry={() => api.refetch()}
      emptyMessage={!api.isLoading && !api.isError && !api.data ? 'The specified skill does not exist.' : undefined}
      sidebar={undefined}
    >
      {api.data && selectedTab === 'documentation' && (
        <>
          <InstallationBlock
            assetType="skill"
            assetName={api.data?.name || name || 'skill'}
            dataApiHostName={config.dataApiHostName}
          />
          {(api.data.description || api.data.summary) ? (
            <MarkdownRenderer markdown={(api.data.description || api.data.summary)!} />
          ) : (
            <EmptyStateMessage>No description available for this skill.</EmptyStateMessage>
          )}
        </>
      )}

      {api.data && selectedTab === 'definition' && (
        <AIAssetDefinition definition={definition} hasVersion={!!selectedVersion} />
      )}

      {selectedTab === 'assessment' && (
        <EvaluationDetails evalResult={evalResult.data} isLoading={evalResult.isLoading} assertionDescriptions={SKILL_ASSERTION_DESCRIPTIONS} />
      )}

      {api.data && selectedTab === 'properties' && (
        <CustomMetadata value={api.data.customProperties} />
      )}
    </DetailPageLayout>
  );
};

export default React.memo(SkillInfo);
```

Key changes from the original:
- Added `useAIAssetVersions`, `useAIAssetDefinition`, `useAIAssetEvaluationResult` (all with `'skills'`)
- Added `selectedVersion` state with auto-select and reset effects
- Added `VersionSelect` in `headerSelector`
- Added `Definition` tab with `AIAssetDefinition` component
- Added download definition button alongside "Install in VS Code"
- Changed tab type to `SkillTab` including `'definition'`
- Default tab remains `'documentation'`
- Header actions guarded with `hasHeaderActions` to avoid rendering empty action bar
- Removed `ConnectPanel` import (was unused in the original)

- [ ] **Step 2: Verify build still passes**

Run: `npx tsc --noEmit 2>&1 | Select-String -NotMatch "openApi.tsx"`

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SkillInfo/SkillInfo.tsx
git commit -m "feat: add version selector, definition tab, and versioned eval to SkillInfo"
```

---

### Task 6: Delete old files and remove legacy methods

Now that all consumers use the new code, remove the old types, hooks, component, and service methods.

**Files:**
- Delete: `src/types/agent.ts`
- Delete: `src/hooks/useAgentVersions.ts`
- Delete: `src/hooks/useAgentDefinition.ts`
- Delete: `src/hooks/useAgentEvaluationResult.ts`
- Delete: `src/hooks/useSkillEvaluationResult.ts`
- Delete: `src/experiences/AgentDefinition/` (entire directory)
- Edit: `src/constants/QueryKeys.ts`
- Edit: `src/types/services/IApiService.ts`
- Edit: `src/services/ApiService.ts`

- [ ] **Step 1: Delete old hook files and types**

```bash
git rm src/types/agent.ts
git rm src/hooks/useAgentVersions.ts
git rm src/hooks/useAgentDefinition.ts
git rm src/hooks/useAgentEvaluationResult.ts
git rm src/hooks/useSkillEvaluationResult.ts
git rm -r src/experiences/AgentDefinition
```

- [ ] **Step 2: Remove old QueryKeys**

In `src/constants/QueryKeys.ts`, remove these 4 entries:

```typescript
  AgentVersions = 'AgentVersions',
  AgentDefinition = 'AgentDefinition',
  SkillEvaluationResult = 'SkillEvaluationResult',
  AgentEvaluationResult = 'AgentEvaluationResult',
```

The final enum should be:

```typescript
export enum QueryKeys {
  Apis = 'Apis',
  Api = 'Api',
  AIAssetVersions = 'AIAssetVersions',
  AIAssetDefinition = 'AIAssetDefinition',
  AIAssetEvaluationResult = 'AIAssetEvaluationResult',
  Server = 'Server',
  ApiVersions = 'ApiVersions',
  ApiDefinitions = 'ApiDefinitions',
  ApiDefinition = 'ApiDefinition',
  ApiDeployments = 'ApiDeployments',
  ApiDeploymentEnvironment = 'ApiDeploymentEnvironment',
  ApiSpec = 'ApiSpec',
  ApiSpecUrl = 'ApiSpecUrl',
  ApiAuthScheme = 'ApiAuthScheme',
  ApiAuthSchemeOptions = 'ApiAuthSchemeOptions',
  HttpTestMutation = 'HttpTestMutation',
  MetadataSchemas = 'MetadataSchemas',
  Plugin = 'Plugin',
  LanguageModel = 'LanguageModel',
}
```

- [ ] **Step 3: Remove old methods from `IApiService`**

In `src/types/services/IApiService.ts`:

Remove the `AgentVersion` import:

```typescript
import { AgentVersion } from '@/types/agent';
```

Remove these 4 methods from the interface:

```typescript
  getSkillEvaluationResult(skillName: string): Promise<SkillEvaluationResult | undefined>;
  getAgentEvaluationResult(agentName: string, versionName: string): Promise<AgentEvaluationResult | undefined>;
  getAgentVersions(agentName: string): Promise<AgentVersion[]>;
  getAgentDefinition(agentName: string, versionName: string): Promise<string | undefined>;
```

- [ ] **Step 4: Remove old methods from `ApiService`**

In `src/services/ApiService.ts`:

Remove the `AgentVersion` import:

```typescript
import { AgentVersion } from '@/types/agent';
```

Remove these 4 method implementations (the entire blocks including their bodies):

- `getSkillEvaluationResult`
- `getAgentEvaluationResult`
- `getAgentVersions`
- `getAgentDefinition`

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "refactor: remove old agent/skill-specific types, hooks, methods, and components"
```

---

### Task 7: Build verification

- [ ] **Step 1: Run TypeScript type-check filtering for our files**

```bash
npx tsc --noEmit 2>&1 | Select-String -NotMatch "openApi.tsx"
```

Expected: No errors. All old references are gone, all new references are in place.

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: Build succeeds. The only errors should be the pre-existing 5 errors in `src/utils/openApi.tsx`.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No new lint errors from our changes.

- [ ] **Step 4: Verify no stale references remain**

```bash
grep -rn "useAgentVersions\|useAgentDefinition\|useAgentEvaluationResult\|useSkillEvaluationResult\|from.*AgentDefinition\|from.*agent.*AgentVersion\|getAgentVersions\|getAgentDefinition\|getAgentEvaluationResult\|getSkillEvaluationResult" src/
```

Expected: No matches. All old references have been replaced.

- [ ] **Step 5: Fix any issues and recommit if needed**

If the build, lint, or stale-reference check finds problems in files we changed, fix and commit:

```bash
git add -A
git commit -m "fix: address build/lint issues from AIAsset refactor"
```
