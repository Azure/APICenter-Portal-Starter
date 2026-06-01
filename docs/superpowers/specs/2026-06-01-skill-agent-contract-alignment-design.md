# Skill & Agent Contract Alignment — Design Spec

## Problem Statement

Three backend PRs bring skills into full endpoint parity with agents:

| PR | Title | Key Change |
|----|-------|------------|
| [15897571](https://msazure.visualstudio.com/One/_git/AAPT-APIM-APICatalog/pullrequest/15897571) | Skill Versions | New `SkillVersion` entity, `GET/LIST /skills/{name}/versions` |
| [15896429](https://msazure.visualstudio.com/One/_git/AAPT-APIM-APICatalog/pullrequest/15896429) | Artifact Contract Alignment | Skill artifact Data API (`Get/List/Download`), agent `value` → string |
| [15909449](https://msazure.visualstudio.com/One/_git/AAPT-APIM-APICatalog/pullrequest/15909449) | Skill Version Endpoint Parity | Versioned artifact routes, `SkillController`, versioned eval results |

The portal must update to:
1. Use all versioned endpoints for skills (matching agents)
2. Render a version selector on the skill detail page
3. Show skill definitions via the same artifact download pattern as agents

## Scope

- **In scope**: Skills and Agents — shared data layer, updated pages
- **Out of scope**: MCP servers (keep current `ApiDefinitionSelect` + standard API pattern)

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Naming prefix | `AIAsset` | Distinguishes from standard `Api` types; covers agents + skills |
| Code sharing | Shared data layer, separate pages | Pages have different tabs/actions; data fetching is identical |
| Skill eval migration | Switch immediately to versioned endpoint | Backend preserves backward compat internally; portal targets latest |
| Skill default tab | `documentation` | Matches current skill UX (agents default to `definition`) |

## Architecture

### 1. Types

**New file: `src/types/aiAsset.ts`**
```typescript
export type AIAssetResourceType = 'agents' | 'skills';

export interface AIAssetVersion {
  name: string;
  title?: string;
  lifecycleStage?: string;
}
```

**Removed**: `src/types/agent.ts` (`AgentVersion` and `AgentArtifact` replaced by `AIAssetVersion`)

### 2. Service Layer

**`IApiService` changes** — replace 4 methods with 3 parameterized ones:

| Old Method | New Method | Endpoint Pattern |
|------------|------------|------------------|
| `getAgentVersions(name)` | `getAIAssetVersions(name, resourceType)` | `GET /{resourceType}/{name}/versions` |
| `getAgentDefinition(name, version)` | `getAIAssetDefinition(name, version, resourceType)` | `GET /{resourceType}/{name}/versions/{v}/artifacts/definition/download` |
| `getAgentEvaluationResult(name, version)` | `getAIAssetEvaluationResult(name, version, resourceType)` | `GET /{resourceType}/{name}/versions/{v}/evaluationResults/default` |
| `getSkillEvaluationResult(name)` | *(merged into above)* | — |

### 3. QueryKeys

| Old Key | New Key |
|---------|---------|
| `AgentVersions` | `AIAssetVersions` |
| `AgentDefinition` | `AIAssetDefinition` |
| `AgentEvaluationResult` | `AIAssetEvaluationResult` |
| `SkillEvaluationResult` | *(merged into above)* |

### 4. Hooks

| Old Hook | New Hook | Signature |
|----------|----------|-----------|
| `useAgentVersions(name)` | `useAIAssetVersions(name, resourceType)` | `name?: string, resourceType: AIAssetResourceType` |
| `useAgentDefinition(name, version)` | `useAIAssetDefinition(name, version, resourceType)` | `name?: string, version?: string, resourceType: AIAssetResourceType` |
| `useAgentEvaluationResult(name, version)` | `useAIAssetEvaluationResult(name, version, resourceType)` | `name?: string, version?: string, resourceType: AIAssetResourceType` |
| `useSkillEvaluationResult(name)` | *(merged into above)* | — |

Query key includes `resourceType` for cache isolation:
```typescript
queryKey: [QueryKeys.AIAssetVersions, name, resourceType]
```

Dev-mock fallback dispatches to the correct mock based on `resourceType`.

### 5. Shared Components

| Old Component | New Component | Changes |
|---------------|---------------|---------|
| `AgentDefinition` | `AIAssetDefinition` | Rename only; same markdown+frontmatter renderer |
| `VersionSelect` | `VersionSelect` | No changes — already generic |

### 6. Page Changes

#### AgentInfo (`src/pages/AgentInfo/AgentInfo.tsx`)
- **Import swaps only** — `useAIAssetVersions`, `useAIAssetDefinition`, `useAIAssetEvaluationResult`, `AIAssetDefinition`
- Pass `'agents'` as `resourceType` to all hooks
- No layout or UX changes

#### SkillInfo (`src/pages/SkillInfo/SkillInfo.tsx`)
- **Add** `VersionSelect` in header selector area
- **Add** `Definition` tab using `AIAssetDefinition` component
- **Add** version state management (auto-select first version, reset on navigation)
- **Add** download definition button in header actions (alongside "Install in VS Code")
- **Update** eval result to use `useAIAssetEvaluationResult('skills')`
- **Keep** "Install in VS Code" button, `InstallationBlock` in documentation tab
- **Keep** default tab as `documentation`

### 7. Files Changed Summary

| Action | Files |
|--------|-------|
| **Create** | `src/types/aiAsset.ts` |
| **Delete** | `src/types/agent.ts` |
| **Rename** | `src/hooks/useAgentVersions.ts` → `src/hooks/useAIAssetVersions.ts` |
| **Rename** | `src/hooks/useAgentDefinition.ts` → `src/hooks/useAIAssetDefinition.ts` |
| **Rename** | `src/hooks/useAgentEvaluationResult.ts` → `src/hooks/useAIAssetEvaluationResult.ts` |
| **Delete** | `src/hooks/useSkillEvaluationResult.ts` |
| **Rename** | `src/experiences/AgentDefinition/` → `src/experiences/AIAssetDefinition/` (includes `.module.scss`) |
| **Edit** | `src/services/ApiService.ts`, `src/types/services/IApiService.ts` |
| **Edit** | `src/constants/QueryKeys.ts` |
| **Edit** | `src/pages/AgentInfo/AgentInfo.tsx` |
| **Edit** | `src/pages/SkillInfo/SkillInfo.tsx` |
| **Edit** | `src/mocks/skillEvaluationMocks.ts` → dispatch logic moved into unified hook |
| **Edit** | `src/mocks/agentEvaluationMocks.ts` → used for `'agents'` resourceType |

## Testing Strategy

- TypeScript compilation must pass (`npm run build`)
- Existing lint rules must pass (`npm run lint`)
- Manual verification: agent detail page works identically to before
- Manual verification: skill detail page shows version selector, definition tab, versioned eval
