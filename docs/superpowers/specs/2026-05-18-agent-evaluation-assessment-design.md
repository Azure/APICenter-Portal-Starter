# Agent Evaluation Assessment — Design Spec

**Date:** 2026-05-18
**Status:** Approved

## Goal

Add an Assessment tab to the agent detail page showing evaluation results, reusing the same UI components as the skill assessment. Extract the existing skill-only evaluation UI into a shared, reusable component system.

## Architecture

### Type System

Create `src/types/evaluation.ts` with a base `EvaluationResult` interface containing all shared fields:

```ts
interface EvaluationResult {
  status: EvalStatus;
  overallScore: number;
  maxScore: number;
  evaluationConfigurationName: string;
  updatedOn: string;
  structuralChecks: EvalTierResult<EvalAssertion>;
  schemaValidation: EvalTierResult<EvalAssertion>;
  qualityAssessment: EvalTierResult<EvalJudgeScore>;
}

interface SkillEvaluationResult extends EvaluationResult {
  skillName: string;
}

interface AgentEvaluationResult extends EvaluationResult {
  agentName: string;
  versionName: string;
}
```

`EvalTierResult`, `EvalAssertion`, `EvalJudgeScore`, and `EvalStatus` move from `skillEvaluation.ts` to `evaluation.ts`. The old `skillEvaluation.ts` file is deleted.

### Shared UI Components

Rename `experiences/SkillEvaluation/` → `experiences/EvaluationDetails/`:

| File | Change |
|---|---|
| `SkillEvaluationDetails.tsx` → `EvaluationDetails.tsx` | Accept `EvaluationResult` (base type) instead of `SkillEvaluationResult` |
| `EvalScoreBadge.tsx` | Accept `EvaluationResult` instead of `SkillEvaluationResult` |
| `EvalScoreBar.tsx` | No change (already uses `EvalJudgeScore`) |
| `EvalRadarChart.tsx` | No change (already uses `EvalJudgeScore`) |
| `EvalAssertionList.tsx` | No change (already uses `EvalTierResult<EvalAssertion>`) |
| `SkillEvaluation.module.scss` → `EvaluationDetails.module.scss` | Rename only |

### API Integration

**New endpoint:** `GET /agents/{agentName}/versions/{versionName}/evaluationResults/default`

Add to `IApiService`:
```ts
getAgentEvaluationResult(agentName: string, versionName: string): Promise<AgentEvaluationResult | undefined>;
```

Add to `ApiService`:
```ts
async getAgentEvaluationResult(agentName: string, versionName: string): Promise<AgentEvaluationResult | undefined> {
  return await HttpService.getOptional<AgentEvaluationResult>(
    `/agents/${encodeURIComponent(agentName)}/versions/${encodeURIComponent(versionName)}/evaluationResults/default`
  );
}
```

### Data Fetching Hook

New `src/hooks/useAgentEvaluationResult.ts`:
- Parameters: `agentName?: string`, `versionName?: string`
- Query key: `[QueryKeys.AgentEvaluationResult, agentName, versionName]`
- Enabled when: `isAuthenticated && agentName && versionName`
- Dev fallback: mock data (same pattern as skills)

Add `AgentEvaluationResult` to `QueryKeys` enum.

### Mock Data

New `src/mocks/agentEvaluationMocks.ts` with representative mock entries for dev preview.

### Agent Detail Page Integration

In `AgentInfo.tsx`:
- Import `useAgentEvaluationResult` and `EvaluationDetails`
- Call `useAgentEvaluationResult(api.data?.name, selectedVersion)`
- Add Assessment tab (conditionally rendered when eval data exists)
- Score badge in tab header with same color thresholds (≥80% green, ≥60% warning, <60% danger)
- Tab type union updated: `'documentation' | 'definition' | 'assessment' | 'properties'`

### Skill Detail Page Update

In `SkillInfo.tsx`:
- Update imports from `EvaluationDetails/` instead of `SkillEvaluation/`
- Use `<EvaluationDetails>` instead of `<SkillEvaluationDetails>`
- No behavior changes

## Version-Binding Behavior

- Assessment shows results for the **currently selected version** in the version dropdown
- Changing version re-fetches evaluation → tab may appear/disappear
- If user is on Assessment tab and switches to a version with no eval data, fall back to Definition tab

## Error Handling

- Backend 404 (no agent, no eval config, no eval result) → hook returns `undefined` → Assessment tab not shown
- Network errors during eval fetch don't block the page — agent details load normally
- Eval query runs in parallel with agent/version queries (independent)

## Files Changed

**New files:**
- `src/types/evaluation.ts`
- `src/hooks/useAgentEvaluationResult.ts`
- `src/mocks/agentEvaluationMocks.ts`
- `src/experiences/EvaluationDetails/` (all files — renamed from SkillEvaluation)

**Modified files:**
- `src/constants/QueryKeys.ts` — add `AgentEvaluationResult`
- `src/types/services/IApiService.ts` — add `getAgentEvaluationResult`
- `src/services/ApiService.ts` — add `getAgentEvaluationResult`
- `src/pages/AgentInfo/AgentInfo.tsx` — add Assessment tab
- `src/pages/SkillInfo/SkillInfo.tsx` — update imports
- `src/hooks/useSkillEvaluationResult.ts` — update type import

**Deleted files:**
- `src/types/skillEvaluation.ts` (replaced by `evaluation.ts`)
- `src/experiences/SkillEvaluation/` (replaced by `EvaluationDetails/`)
