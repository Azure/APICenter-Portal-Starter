# React Best Practices

## Component Design

- Keep components focused on a single UI responsibility.
- Prefer composing small presentational components into experience-level components instead of adding multiple unrelated concerns to one file.
- Keep page components thin and move reusable logic into hooks, services, atoms, or lower-level components.
- Co-locate a component's styles, tests, and index exports with the component folder when that pattern already exists.

## Props And Interfaces

- Define explicit TypeScript interfaces or type aliases for component props.
- Keep props narrowly scoped; avoid passing large data objects when a component only needs a few fields.
- Prefer stable, descriptive prop names that reflect user-facing behavior rather than implementation details.
- Mark optional props deliberately and provide sensible defaults where that improves readability.

## Hooks And State

- Use custom hooks for data access, side effects, and cross-cutting behavior instead of embedding that logic directly inside view components.
- Keep local UI state local. Promote state to atoms or shared hooks only when multiple parts of the app genuinely depend on it.
- Keep hook call order static and do not call hooks conditionally.
- Derive view state from props or fetched data when possible instead of duplicating it in component state.

## Rendering Guidance

- Handle loading, empty, success, and error states explicitly.
- Prefer declarative rendering over imperative DOM manipulation.
- Keep JSX readable by extracting repeated or deeply nested sections into subcomponents.
- Memoization should be driven by measured need or existing patterns in the surrounding code, not added by default.

## Data And Side Effects

- Keep API calls and data transformations in hooks or service-layer code rather than inline in render-heavy components.
- Normalize or transform backend data before it reaches deeply nested presentation components.
- Guard side effects with clear dependencies and cleanup logic.
- Prefer idempotent effects and avoid effect chains that are difficult to reason about.

## Accessibility

- Use semantic HTML where possible before reaching for generic containers.
- Ensure interactive controls are keyboard accessible and have clear labels.
- Preserve heading hierarchy within pages and major panels.
- Provide meaningful alt text, button text, and status messaging for assistive technologies.

## File Organization

- Keep main component logic in `ComponentName.tsx` and expose public imports through `index.ts` where the folder already uses that pattern.
- Keep styles in `ComponentName.module.scss` for component-scoped styling.
- Avoid mixing unrelated exports into the same component folder.
- When a component grows multiple responsibilities, split it before the file becomes difficult to review.