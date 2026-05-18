# Agent Evaluation Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Assessment tab to the agent detail page with reusable evaluation UI components extracted from the existing skill assessment.

**Architecture:** Extract shared `EvaluationResult` base type and rename `SkillEvaluation` UI components to generic `EvaluationDetails`. Add agent-specific API service method, React Query hook, and mock data. Wire Assessment tab into `AgentInfo.tsx` bound to the selected version.

**Tech Stack:** React 18, TypeScript, Fluent UI v9, React Query, Recoil, SCSS modules

---

### Task 1: Create shared evaluation types

**Files:**
- Create: `src/types/evaluation.ts`

This task extracts the type definitions from `src/types/skillEvaluation.ts` into a new shared file with a base `EvaluationResult` interface, plus `SkillEvaluationResult` and `AgentEvaluationResult` extensions.

- [ ] **Step 1: Create `src/types/evaluation.ts`**

```ts
/** Shared evaluation result types for skill and agent assessments. */

export type EvalStatus = 'pass' | 'fail';

export interface EvalTierResult<T = unknown> {
  status: EvalStatus;
  passed: number;
  total: number;
  weightedScore: number | null;
  maxWeightedScore: number | null;
  /** Present on structuralChecks / schemaValidation tiers. */
  assertions?: T[];
  /** Present on qualityAssessment tier. */
  scores?: T[];
}

export interface EvalAssertion {
  name: string;
  status: EvalStatus;
  message: string;
}

export interface EvalJudgeScore {
  name: string;
  score: number;
  maxScore: number;
  passed: boolean;
  reasoning: string;
}

/** Base evaluation result shared by skill and agent assessments. */
export interface EvaluationResult {
  status: EvalStatus;
  overallScore: number;
  maxScore: number;
  evaluationConfigurationName: string;
  updatedOn: string;
  structuralChecks: EvalTierResult<EvalAssertion>;
  schemaValidation: EvalTierResult<EvalAssertion>;
  qualityAssessment: EvalTierResult<EvalJudgeScore>;
}

/** Skill-specific evaluation result. */
export interface SkillEvaluationResult extends EvaluationResult {
  skillName: string;
}

/** Agent-specific evaluation result (version-scoped). */
export interface AgentEvaluationResult extends EvaluationResult {
  agentName: string;
  versionName: string;
}
```

- [ ] **Step 2: Replace `src/types/skillEvaluation.ts` with a re-export shim**

Replace the entire content of `src/types/skillEvaluation.ts` with a temporary re-export so existing imports keep working while we migrate:

```ts
/**
 * @deprecated Import from '@/types/evaluation' instead.
 * Temporary re-export shim — will be deleted after all imports are migrated.
 */
export * from './evaluation';
```

- [ ] **Step 3: Commit**

```bash
git add src/types/evaluation.ts src/types/skillEvaluation.ts
git commit -m "refactor: extract shared evaluation types with re-export shim

Create evaluation.ts with base EvaluationResult interface plus Skill and
Agent extensions. Replace skillEvaluation.ts with a temporary re-export
shim so existing imports keep building during migration.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Rename and generalize evaluation UI components

**Files:**
- Create: `src/experiences/EvaluationDetails/EvaluationDetails.tsx` (from SkillEvaluationDetails.tsx)
- Create: `src/experiences/EvaluationDetails/EvalScoreBadge.tsx` (from SkillEvaluation/EvalScoreBadge.tsx)
- Create: `src/experiences/EvaluationDetails/EvalScoreBar.tsx` (from SkillEvaluation/EvalScoreBar.tsx)
- Create: `src/experiences/EvaluationDetails/EvalRadarChart.tsx` (from SkillEvaluation/EvalRadarChart.tsx)
- Create: `src/experiences/EvaluationDetails/EvalAssertionList.tsx` (from SkillEvaluation/EvalAssertionList.tsx)
- Create: `src/experiences/EvaluationDetails/EvaluationDetails.module.scss` (from SkillEvaluation.module.scss)
- Create: `src/experiences/EvaluationDetails/index.ts`
- Delete: `src/experiences/SkillEvaluation/` (entire directory)

This task uses `git mv` for the directory rename, then updates imports and type references.

- [ ] **Step 1: Rename the directory**

```bash
git mv src/experiences/SkillEvaluation src/experiences/EvaluationDetails
```

- [ ] **Step 2: Rename the SCSS file**

```bash
git mv src/experiences/EvaluationDetails/SkillEvaluation.module.scss src/experiences/EvaluationDetails/EvaluationDetails.module.scss
```

- [ ] **Step 3: Rename the main component file**

```bash
git mv src/experiences/EvaluationDetails/SkillEvaluationDetails.tsx src/experiences/EvaluationDetails/EvaluationDetails.tsx
```

- [ ] **Step 4: Update `EvaluationDetails.tsx`**

Replace the entire file content. Changes from original:
- Import `EvaluationResult` and `EvalJudgeScore` from `@/types/evaluation` (was `@/types/skillEvaluation`)
- Import styles from `./EvaluationDetails.module.scss` (was `./SkillEvaluation.module.scss`)
- Rename interface `SkillEvaluationDetailsProps` → `EvaluationDetailsProps`, prop type `SkillEvaluationResult` → `EvaluationResult`
- Rename exported component `SkillEvaluationDetails` → `EvaluationDetails`

```tsx
import React, { useState } from 'react';
import { Badge, Spinner } from '@fluentui/react-components';
import { Warning20Filled } from '@fluentui/react-icons';
import { EvaluationResult, EvalJudgeScore } from '@/types/evaluation';
import { EvalScoreBar } from './EvalScoreBar';
import { EvalAssertionList } from './EvalAssertionList';
import { EvalRadarChart } from './EvalRadarChart';
import styles from './EvaluationDetails.module.scss';

interface EvaluationDetailsProps {
  evalResult?: EvaluationResult;
  isLoading?: boolean;
  /** Optional map of assertion name → human-readable description. */
  assertionDescriptions?: Record<string, string>;
}

/** Default threshold for passing (normalized to /5 scale). */
const THRESHOLD = 4.0;

/** Generate a brief AI-style summary based on tier results. */
function buildSummary(evalResult: EvaluationResult): string {
  const scores = evalResult.qualityAssessment.scores ?? [];
  const low = scores.filter(s => s.score < THRESHOLD);
  const high = scores.filter(s => s.score >= THRESHOLD);

  const parts: string[] = [];
  if (high.length > 0) {
    const names = high.map(s => s.name.replace(/[-_]/g, ' ')).join(', ');
    parts.push(`Performs well on ${names}.`);
  }
  if (low.length > 0) {
    const names = low.map(s => s.name.replace(/[-_]/g, ' ')).join(', ');
    parts.push(`Falls short on ${names}.`);
  }
  parts.push(`Recommended threshold is ${THRESHOLD.toFixed(1)}/5.`);
  return parts.join(' ');
}

/** Generate improvement recommendations from low-scoring criteria. */
function buildRecommendations(scores: EvalJudgeScore[]): Array<{ title: string; description: string; impact: 'high' | 'medium' }> {
  return scores
    .filter(s => s.score < THRESHOLD)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(s => ({
      title: `Improve ${s.name.replace(/[-_]/g, ' ')}`,
      description: s.reasoning,
      impact: s.score < 3 ? 'high' as const : 'medium' as const,
    }));
}

export const EvaluationDetails: React.FC<EvaluationDetailsProps> = ({
  evalResult,
  isLoading,
  assertionDescriptions,
}) => {
  const [highlightedCriterion, setHighlightedCriterion] = useState<string | null>(null);

  if (isLoading) {
    return <Spinner size="small" label="Loading assessment results..." labelPosition="below" />;
  }

  if (!evalResult) return null;

  const normalized = evalResult.maxScore > 0
    ? (evalResult.overallScore / evalResult.maxScore) * 5
    : 0;
  const ratio = evalResult.maxScore > 0 ? evalResult.overallScore / evalResult.maxScore : 0;

  function headerBadgeColor(): 'success' | 'warning' | 'danger' {
    if (ratio >= 0.8) return 'success';
    if (ratio >= 0.6) return 'warning';
    return 'danger';
  }

  const scores = evalResult.qualityAssessment.scores ?? [];
  const belowThreshold = normalized < THRESHOLD;
  const recommendations = buildRecommendations(scores);

  return (
    <div className={styles.evalDetails}>
      {/* Overall header */}
      <div className={styles.evalHeader}>
        <Badge
          appearance="filled"
          color={headerBadgeColor()}
          shape="circular"
          size="large"
          className={styles.evalHeaderBadge}
        >
          {normalized.toFixed(1)} <span className={styles.scoreBadgeMax}>/5</span>
        </Badge>
        <h3 className={styles.evalHeaderTitle}>AI Quality Score</h3>
        {belowThreshold ? (
          <Badge appearance="filled" color="warning" shape="circular">
            <span className={styles.thresholdBadge}>
              <Warning20Filled />
              Below threshold
            </span>
          </Badge>
        ) : (
          <Badge appearance="filled" color="success" shape="circular">
            Passed
          </Badge>
        )}
      </div>

      {evalResult.updatedOn && (
        <p className={styles.evalUpdated}>
          Assessed on {new Date(evalResult.updatedOn).toLocaleDateString()}
        </p>
      )}

      {/* AI Summary */}
      <p className={styles.aiSummary}>
        {buildSummary(evalResult)}
      </p>

      {/* Quality assessment — criteria cards + radar chart */}
      {scores.length > 0 && (
        <div className={styles.evalSection}>
          <h4 className={styles.evalSectionTitle}>Assessment</h4>
          <div className={scores.length >= 3 ? styles.evalContentLayout : undefined}>
            <div className={styles.criteriaList}>
              {scores.map((s) => (
                <EvalScoreBar
                  key={s.name}
                  score={s}
                  isHighlighted={highlightedCriterion === s.name}
                  onHoverCriterion={setHighlightedCriterion}
                />
              ))}
            </div>
            {scores.length >= 3 && (
              <EvalRadarChart
                scores={scores}
                highlightedCriterion={highlightedCriterion}
                onHoverCriterion={setHighlightedCriterion}
              />
            )}
          </div>
        </div>
      )}

      {/* Top Improvements */}
      {recommendations.length > 0 && (
        <div className={styles.evalSection}>
          <h4 className={styles.evalSectionTitle}>💡 Top Improvements</h4>
          {recommendations.map((rec, i) => (
            <div key={i} className={styles.recCard}>
              <div className={`${styles.recSeverity} ${rec.impact === 'high' ? styles.recSeverityHigh : styles.recSeverityMedium}`} />
              <div className={styles.recContent}>
                <h4>
                  {rec.title}
                  <Badge
                    appearance="filled"
                    color={rec.impact === 'high' ? 'danger' : 'warning'}
                    shape="circular"
                    size="small"
                    style={{ marginLeft: 6, verticalAlign: 'middle' }}
                  >
                    {rec.impact === 'high' ? 'High Impact' : 'Medium'}
                  </Badge>
                </h4>
                <p>{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Structural checks */}
      <EvalAssertionList title="Structural Checks" tier={evalResult.structuralChecks} assertionDescriptions={assertionDescriptions} />

      {/* Schema validation */}
      <EvalAssertionList title="Schema Validation" tier={evalResult.schemaValidation} assertionDescriptions={assertionDescriptions} />
    </div>
  );
};

export default React.memo(EvaluationDetails);
```

- [ ] **Step 5: Update `EvalScoreBadge.tsx`**

Change type import from `SkillEvaluationResult` to `EvaluationResult` and update the SCSS import:

```tsx
import React from 'react';
import { Badge } from '@fluentui/react-components';
import { EvaluationResult } from '@/types/evaluation';
import styles from './EvaluationDetails.module.scss';

interface EvalScoreBadgeProps {
  evalResult?: EvaluationResult;
}

type BadgeColor = 'success' | 'warning' | 'danger';

function scoreBadgeColor(ratio: number): BadgeColor {
  if (ratio >= 0.8) return 'success';
  if (ratio >= 0.6) return 'warning';
  return 'danger';
}

/** Compact score pill for the header metadata area. */
export const EvalScoreBadge: React.FC<EvalScoreBadgeProps> = ({ evalResult }) => {
  if (!evalResult || evalResult.maxScore <= 0) return null;

  const ratio = evalResult.overallScore / evalResult.maxScore;
  const normalized = ratio * 5;
  const display = normalized.toFixed(1);
  const color = scoreBadgeColor(ratio);

  return (
    <span className={styles.scoreBadge}>
      <Badge
        appearance="filled"
        color={color}
        shape="circular"
        className={styles.scoreBadgePill}
      >
        {display} <span className={styles.scoreBadgeMax}>/5</span>
      </Badge>
      <span className={styles.scoreBadgeLabel}>AI Quality Score</span>
    </span>
  );
};

export default React.memo(EvalScoreBadge);
```

- [ ] **Step 6: Update `EvalScoreBar.tsx`**

Change type import source only:

```tsx
import React from 'react';
import { EvalJudgeScore } from '@/types/evaluation';
import styles from './EvaluationDetails.module.scss';

interface EvalScoreBarProps {
  score: EvalJudgeScore;
  isHighlighted?: boolean;
  onHoverCriterion?: (name: string | null) => void;
}

const THRESHOLD = 4.0;

function formatLabel(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const EvalScoreBar: React.FC<EvalScoreBarProps> = ({ score, isHighlighted, onHoverCriterion }) => {
  const pct = score.maxScore > 0 ? (score.score / score.maxScore) * 100 : 0;
  const isPassing = score.score >= THRESHOLD;

  return (
    <div
      className={`${styles.criterionCard} ${isHighlighted ? styles.criterionHighlighted : ''}`}
      onMouseEnter={() => onHoverCriterion?.(score.name)}
      onMouseLeave={() => onHoverCriterion?.(null)}
    >
      <div className={styles.criterionCardHeader}>
        <span className={styles.criterionName}>{formatLabel(score.name)}</span>
        <span className={`${styles.criterionScore} ${isPassing ? styles.criterionScorePass : styles.criterionScoreFail}`}>
          {score.score.toFixed(1)}
        </span>
      </div>
      <div className={styles.criterionBarTrack}>
        <div
          className={`${styles.criterionBarFill} ${isPassing ? styles.criterionBarFillPass : styles.criterionBarFillFail}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {score.reasoning && (
        <p className={styles.criterionReasoning}>{score.reasoning}</p>
      )}
    </div>
  );
};

export default React.memo(EvalScoreBar);
```

- [ ] **Step 7: Update `EvalRadarChart.tsx`**

Change type import source only:

```tsx
import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { EvalJudgeScore } from '@/types/evaluation';
import styles from './EvaluationDetails.module.scss';
```

The rest of the file is unchanged. Only replace the first 3 import lines.

- [ ] **Step 8: Update `EvalAssertionList.tsx`**

Change type import source, update SCSS import, and add optional `assertionDescriptions` prop:

```tsx
import React from 'react';
import {
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  ChevronRight20Regular,
} from '@fluentui/react-icons';
import { EvalAssertion, EvalTierResult } from '@/types/evaluation';
import styles from './EvaluationDetails.module.scss';

interface EvalAssertionListProps {
  title: string;
  tier: EvalTierResult<EvalAssertion>;
  /** Optional map of assertion name → human-readable description. */
  assertionDescriptions?: Record<string, string>;
}

export const EvalAssertionList: React.FC<EvalAssertionListProps> = ({ title, tier, assertionDescriptions }) => {
  const assertions = tier.assertions ?? [];

  return (
    <details className={styles.assertionSection}>
      <summary>
        <span className={styles.assertionChevron}>
          <ChevronRight20Regular />
        </span>
        <h4 className={styles.assertionTitle}>{title}</h4>
        <span className={`${styles.assertionCount} ${tier.status === 'pass' ? styles.assertionCountPass : styles.assertionCountFail}`}>
          {tier.passed}/{tier.total} passed
        </span>
      </summary>

      {assertions.length > 0 && (
        <ul className={styles.assertionList}>
          {assertions.map((a) => {
            const description = assertionDescriptions?.[a.name];
            return (
              <li key={a.name} className={styles.assertionItem}>
                {a.status === 'pass' ? (
                  <CheckmarkCircle20Regular className={styles.assertionIconPass} />
                ) : (
                  <DismissCircle20Regular className={styles.assertionIconFail} />
                )}
                <div>
                  <span className={styles.assertionName}>{a.name}</span>
                  {a.message && <span className={styles.assertionMessage}> — {a.message}</span>}
                  {description && <p className={styles.assertionDescription}>{description}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
};

export default React.memo(EvalAssertionList);
```

- [ ] **Step 9: Update `index.ts`**

```ts
export { EvalScoreBadge } from './EvalScoreBadge';
export { EvaluationDetails } from './EvaluationDetails';
export { EvalScoreBar } from './EvalScoreBar';
export { EvalAssertionList } from './EvalAssertionList';
export { EvalRadarChart } from './EvalRadarChart';
```

- [ ] **Step 10: Commit**

```bash
git add src/experiences/EvaluationDetails/ src/experiences/SkillEvaluation/
git commit -m "refactor: rename SkillEvaluation to EvaluationDetails

Generalize evaluation UI components to accept base EvaluationResult type.
Add assertionDescriptions prop for consumer-specific assertion labels.
Rename SCSS module and update all imports.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Add agent evaluation to API service layer

**Files:**
- Modify: `src/constants/QueryKeys.ts`
- Modify: `src/types/services/IApiService.ts`
- Modify: `src/services/ApiService.ts`

- [ ] **Step 1: Add `AgentEvaluationResult` query key**

In `src/constants/QueryKeys.ts`, add the new key after `SkillEvaluationResult`:

```ts
  SkillEvaluationResult = 'SkillEvaluationResult',
  AgentEvaluationResult = 'AgentEvaluationResult',
```

- [ ] **Step 2: Update `IApiService` interface**

In `src/types/services/IApiService.ts`:

Replace the import line:
```ts
import { SkillEvaluationResult } from '@/types/skillEvaluation';
```
with:
```ts
import { SkillEvaluationResult, AgentEvaluationResult } from '@/types/evaluation';
```

Add after the `getSkillEvaluationResult` method signature:
```ts
  getAgentEvaluationResult(agentName: string, versionName: string): Promise<AgentEvaluationResult | undefined>;
```

- [ ] **Step 3: Update `ApiService` implementation**

In `src/services/ApiService.ts`:

Replace the import line:
```ts
import { SkillEvaluationResult } from '@/types/skillEvaluation';
```
with:
```ts
import { SkillEvaluationResult, AgentEvaluationResult } from '@/types/evaluation';
```

Also update the `getSkillEvaluationResult` method to URL-encode the skill name:
```ts
  async getSkillEvaluationResult(skillName: string): Promise<SkillEvaluationResult | undefined> {
    return await HttpService.getOptional<SkillEvaluationResult>(`/skills/${encodeURIComponent(skillName)}/evaluationResults/default`);
  },
```

Add after `getSkillEvaluationResult`:
```ts
  async getAgentEvaluationResult(agentName: string, versionName: string): Promise<AgentEvaluationResult | undefined> {
    return await HttpService.getOptional<AgentEvaluationResult>(
      `/agents/${encodeURIComponent(agentName)}/versions/${encodeURIComponent(versionName)}/evaluationResults/default`
    );
  },
```

- [ ] **Step 4: Commit**

```bash
git add src/constants/QueryKeys.ts src/types/services/IApiService.ts src/services/ApiService.ts
git commit -m "feat: add getAgentEvaluationResult to API service

New endpoint: GET /agents/{name}/versions/{ver}/evaluationResults/default
Add AgentEvaluationResult query key. URL-encode names in both skill
and agent evaluation endpoints.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 4: Create agent evaluation mock data and hook

**Files:**
- Create: `src/mocks/agentEvaluationMocks.ts`
- Create: `src/hooks/useAgentEvaluationResult.ts`
- Modify: `src/hooks/useSkillEvaluationResult.ts` (update import)

- [ ] **Step 1: Create `src/mocks/agentEvaluationMocks.ts`**

```ts
/**
 * DEV-ONLY mock evaluation results for previewing the agent Assessment tab UI.
 * Remove this file when the backend returns real evaluation data.
 */
import { AgentEvaluationResult } from '@/types/evaluation';

const MOCK_EVAL_RESULTS: Record<string, AgentEvaluationResult> = {
  'travel-agent': {
    agentName: 'travel-agent',
    versionName: '1.0.0',
    status: 'pass',
    overallScore: 4.3,
    maxScore: 5,
    evaluationConfigurationName: 'default',
    updatedOn: '2026-05-10T14:30:00Z',
    structuralChecks: {
      status: 'pass',
      passed: 5,
      total: 5,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'definition-present', status: 'pass', message: 'Agent definition found' },
        { name: 'has-name', status: 'pass', message: 'Agent name declared' },
        { name: 'has-description', status: 'pass', message: 'Description field present' },
        { name: 'body-not-empty', status: 'pass', message: 'Definition contains meaningful content' },
        { name: 'has-capabilities', status: 'pass', message: 'Agent capabilities defined' },
      ],
    },
    schemaValidation: {
      status: 'pass',
      passed: 4,
      total: 4,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'has-instructions-section', status: 'pass', message: 'Instructions section found' },
        { name: 'has-examples-section', status: 'pass', message: 'Examples section present' },
        { name: 'has-error-handling-section', status: 'pass', message: 'Error handling documented' },
        { name: 'valid-schema', status: 'pass', message: 'Schema validates correctly' },
      ],
    },
    qualityAssessment: {
      status: 'pass',
      passed: 5,
      total: 5,
      weightedScore: 4.3,
      maxWeightedScore: 5,
      scores: [
        { name: 'instruction-clarity', score: 4.6, maxScore: 5, passed: true, reasoning: 'Clear step-by-step instructions with good examples.' },
        { name: 'help-completeness', score: 4.0, maxScore: 5, passed: true, reasoning: 'Comprehensive coverage of common usage patterns.' },
        { name: 'safety-guidance', score: 4.5, maxScore: 5, passed: true, reasoning: 'Good coverage of security practices and data sensitivity.' },
        { name: 'error-handling', score: 4.2, maxScore: 5, passed: true, reasoning: 'Detailed error handling for common failure scenarios.' },
        { name: 'usage-examples', score: 4.2, maxScore: 5, passed: true, reasoning: 'Solid examples covering real-world scenarios.' },
      ],
    },
  },
  'code-review-agent': {
    agentName: 'code-review-agent',
    versionName: '2.1.0',
    status: 'fail',
    overallScore: 3.2,
    maxScore: 5,
    evaluationConfigurationName: 'default',
    updatedOn: '2026-05-08T09:15:00Z',
    structuralChecks: {
      status: 'pass',
      passed: 4,
      total: 5,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'definition-present', status: 'pass', message: 'Agent definition found' },
        { name: 'has-name', status: 'pass', message: 'Agent name declared' },
        { name: 'has-description', status: 'pass', message: 'Description field present' },
        { name: 'body-not-empty', status: 'pass', message: 'Definition contains meaningful content' },
        { name: 'has-capabilities', status: 'fail', message: 'No capabilities section defined' },
      ],
    },
    schemaValidation: {
      status: 'fail',
      passed: 2,
      total: 4,
      weightedScore: null,
      maxWeightedScore: null,
      assertions: [
        { name: 'has-instructions-section', status: 'pass', message: 'Instructions section found' },
        { name: 'has-examples-section', status: 'fail', message: 'No examples section found' },
        { name: 'has-error-handling-section', status: 'fail', message: 'Missing error handling section' },
        { name: 'valid-schema', status: 'pass', message: 'Schema validates correctly' },
      ],
    },
    qualityAssessment: {
      status: 'fail',
      passed: 2,
      total: 5,
      weightedScore: 3.2,
      maxWeightedScore: 5,
      scores: [
        { name: 'instruction-clarity', score: 3.8, maxScore: 5, passed: false, reasoning: 'Instructions could be more detailed with concrete examples.' },
        { name: 'help-completeness', score: 2.5, maxScore: 5, passed: false, reasoning: 'Missing coverage of several common review patterns.' },
        { name: 'safety-guidance', score: 4.0, maxScore: 5, passed: true, reasoning: 'Adequate security review guidance.' },
        { name: 'error-handling', score: 2.8, maxScore: 5, passed: false, reasoning: 'Limited error handling documentation.' },
        { name: 'usage-examples', score: 3.0, maxScore: 5, passed: false, reasoning: 'Only basic examples provided.' },
      ],
    },
  },
};

export function getMockAgentEvalResult(agentName: string): AgentEvaluationResult | undefined {
  return MOCK_EVAL_RESULTS[agentName];
}
```

- [ ] **Step 2: Create `src/hooks/useAgentEvaluationResult.ts`**

```ts
import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { AgentEvaluationResult } from '@/types/evaluation';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { getMockAgentEvalResult } from '@/mocks/agentEvaluationMocks';

export function useAgentEvaluationResult(agentName?: string, versionName?: string) {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<AgentEvaluationResult | undefined>({
    queryKey: [QueryKeys.AgentEvaluationResult, agentName, versionName],
    queryFn: async () => {
      const result = await ApiService.getAgentEvaluationResult(agentName!, versionName!);
      // DEV FALLBACK: use mock data when backend returns nothing.
      // Remove this fallback when real evaluation data is available.
      if (!result && import.meta.env.DEV) {
        return getMockAgentEvalResult(agentName!);
      }
      return result;
    },
    staleTime: Infinity,
    enabled: Boolean(isAuthenticated && agentName && versionName),
  });
}
```

- [ ] **Step 3: Update `src/hooks/useSkillEvaluationResult.ts` import**

Replace:
```ts
import { SkillEvaluationResult } from '@/types/skillEvaluation';
```
with:
```ts
import { SkillEvaluationResult } from '@/types/evaluation';
```

- [ ] **Step 4: Update mock import in `src/mocks/skillEvaluationMocks.ts`**

Replace:
```ts
import { SkillEvaluationResult } from '@/types/skillEvaluation';
```
with:
```ts
import { SkillEvaluationResult } from '@/types/evaluation';
```

- [ ] **Step 5: Commit**

```bash
git add src/mocks/agentEvaluationMocks.ts src/hooks/useAgentEvaluationResult.ts src/hooks/useSkillEvaluationResult.ts src/mocks/skillEvaluationMocks.ts
git commit -m "feat: add useAgentEvaluationResult hook and mock data

New hook fetches agent evaluation results per version with dev mock
fallback. Update skill hook and mocks to import from shared types.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 5: Update SkillInfo page to use shared components

**Files:**
- Modify: `src/pages/SkillInfo/SkillInfo.tsx`

- [ ] **Step 1: Update imports in `SkillInfo.tsx`**

Replace:
```ts
import { SkillEvaluationDetails } from '@/experiences/SkillEvaluation';
```
with:
```ts
import { EvaluationDetails } from '@/experiences/EvaluationDetails';
```

- [ ] **Step 2: Add skill-specific assertion descriptions constant**

Add after the `SKILL_SOURCE_URL` constant:

```ts
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
```

- [ ] **Step 3: Replace component usage**

Replace:
```tsx
        <SkillEvaluationDetails evalResult={evalResult.data} isLoading={evalResult.isLoading} />
```
with:
```tsx
        <EvaluationDetails evalResult={evalResult.data} isLoading={evalResult.isLoading} assertionDescriptions={SKILL_ASSERTION_DESCRIPTIONS} />
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/SkillInfo/SkillInfo.tsx
git commit -m "refactor: update SkillInfo to use shared EvaluationDetails

Replace SkillEvaluationDetails with EvaluationDetails, pass skill-specific
assertion descriptions via prop.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 6: Add Assessment tab to AgentInfo page

**Files:**
- Modify: `src/pages/AgentInfo/AgentInfo.tsx`

- [ ] **Step 1: Add imports**

Add these imports to the top of `AgentInfo.tsx`:

```ts
import { Badge } from '@fluentui/react-components';
```

(Badge is already imported — verify it's in the existing import from `@fluentui/react-components`.)

Add new imports:

```ts
import { useAgentEvaluationResult } from '@/hooks/useAgentEvaluationResult';
import { EvaluationDetails } from '@/experiences/EvaluationDetails';
```

- [ ] **Step 2: Update tab type union**

Replace:
```ts
type AgentTab = 'documentation' | 'definition' | 'properties';
```
with:
```ts
type AgentTab = 'documentation' | 'definition' | 'assessment' | 'properties';
```

- [ ] **Step 3: Add evaluation hook call**

Add after the `definition` hook call (line 42):

```ts
  const evalResult = useAgentEvaluationResult(api.data?.name, selectedVersion);
```

- [ ] **Step 4: Add effect to reset selectedVersion on agent change and handle stale assessment tab**

Add after the existing `useEffect` that auto-selects the first version (after line 40):

```ts
  // Reset selected version when navigating to a different agent.
  useEffect(() => {
    setSelectedVersion(undefined);
  }, [name]);

  // Fall back to definition tab if assessment data disappears after version change.
  useEffect(() => {
    if (
      selectedTab === 'assessment' &&
      evalResult.isFetched &&
      !evalResult.isFetching &&
      !evalResult.data
    ) {
      setSelectedTab('definition');
    }
  }, [selectedTab, evalResult.isFetched, evalResult.isFetching, evalResult.data]);
```

- [ ] **Step 5: Add Assessment tab to TabList**

In the `tabs` prop JSX, add the Assessment tab after the Documentation tab and before the properties tab:

```tsx
          <Tab icon={<DocumentRegular />} value="documentation">
            Documentation
          </Tab>
          {evalResult.data && (
            <Tab value="assessment">
              Assessment
              {evalResult.data.maxScore > 0 && (
                <Badge
                  appearance="filled"
                  color={
                    (evalResult.data.overallScore / evalResult.data.maxScore) >= 0.8 ? 'success'
                    : (evalResult.data.overallScore / evalResult.data.maxScore) >= 0.6 ? 'warning'
                    : 'danger'
                  }
                  shape="circular"
                  style={{ marginLeft: 8 }}
                >
                  {((evalResult.data.overallScore / evalResult.data.maxScore) * 5).toFixed(1)}/5
                </Badge>
              )}
            </Tab>
          )}
          {hasCustomProps && <Tab value="properties">Additional properties</Tab>}
```

- [ ] **Step 6: Add Assessment tab content**

Add after the definition tab content block and before the properties tab content block:

```tsx
      {selectedTab === 'assessment' && (
        <EvaluationDetails evalResult={evalResult.data} isLoading={evalResult.isLoading} />
      )}
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/AgentInfo/AgentInfo.tsx
git commit -m "feat: add Assessment tab to agent detail page

Show evaluation results for the selected agent version using shared
EvaluationDetails component. Tab appears when data exists, score badge
in tab header. Falls back to Definition when assessment unavailable.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 7: Delete re-export shim and build verification

**Files:**
- Delete: `src/types/skillEvaluation.ts`

- [ ] **Step 1: Delete the re-export shim**

```bash
git rm src/types/skillEvaluation.ts
```

- [ ] **Step 2: Run the build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors. There should be no remaining references to `@/types/skillEvaluation` or `@/experiences/SkillEvaluation`.

- [ ] **Step 3: Verify no stale imports**

```bash
git grep "types/skillEvaluation" -- src/
git grep "experiences/SkillEvaluation" -- src/
git grep "SkillEvaluationDetails" -- src/
git grep "SkillEvaluation.module.scss" -- src/
```

Expected: No matches for any of these patterns.

- [ ] **Step 4: Run lint if configured**

```bash
npm run lint
```

Expected: No new lint errors introduced.

- [ ] **Step 5: Commit**

```bash
git add src/types/skillEvaluation.ts
git commit -m "chore: remove skillEvaluation.ts re-export shim

All imports migrated to @/types/evaluation. Shim no longer needed.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
