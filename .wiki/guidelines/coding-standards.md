# Coding Standards

## General Standards

- Keep implementations consistent with the existing TypeScript, React, and service-layer patterns in the repo.
- Prefer clear, intention-revealing names for functions, variables, types, and files.
- Keep functions focused and avoid mixing unrelated responsibilities in a single unit.
- Favor explicitness over cleverness when the two are in tension.

## TypeScript Expectations

- Use explicit types for public APIs, component props, exported helpers, and service contracts.
- Prefer well-named interfaces or type aliases over repeated inline object shapes.
- Avoid `any` unless there is a justified interoperability boundary and the limitation is documented.
- Narrow nullable and union values before use instead of relying on unchecked assertions.

## React And UI Code

- Keep render paths easy to read and separate data preparation from JSX where practical.
- Extract repeated UI structures or branching logic into helper functions or subcomponents when it materially improves readability.
- Prefer controlled, explicit state transitions over implicit behavior spread across multiple handlers.
- Keep user-visible text clear and consistent across components.

## JSDoc Requirements

- Add JSDoc to exported functions, hooks, classes, and non-trivial utilities.
- Add JSDoc to component props interfaces when the fields are not immediately obvious from their names.
- Every JSDoc block for functions or methods must describe parameters with `@param` entries.
- Include `@returns` when the return value is not obvious from the signature alone.
- Include `@example` for utilities, hooks, or APIs where a short usage example improves readability or reduces ambiguity.
- Keep JSDoc accurate as implementations evolve; stale documentation is treated as a defect.

## JSDoc Example

```ts
/**
 * Builds a shareable URL for the selected API operation.
 *
 * @param apiName - The API name from Azure API Center.
 * @param operationId - The selected operation identifier.
 * @returns A deep link that can be copied or opened directly.
 * @example
 * buildApiOperationLink('orders', 'get-order')
 */
export function buildApiOperationLink(apiName: string, operationId: string): string {
  return `/apis/${apiName}?operation=${operationId}`;
}
```

## Review Checklist

- Public APIs are typed clearly.
- Complex logic has concise, accurate JSDoc.
- Parameters are documented where JSDoc is required.
- Examples are included where they materially improve readability.
- Naming, structure, and control flow remain straightforward to maintain.