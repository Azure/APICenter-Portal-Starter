# MCP Tool Argument Type Conversion Design

## Problem

The MCP test console collects every argument through `api-docs-ui` as a string.
`useMcpTestRunController` currently forwards those values unchanged, so a tool
argument declared as an integer is serialized as `"2"` instead of `2`.

## Scope

Add schema-aware conversion and validation immediately before an MCP tool call.
Keep the existing form and MCP transport unchanged. Prompt arguments and resource
URI arguments are outside this change.

## Design

Add a pure utility under `src/utils/` that accepts:

- the tool's `inputSchema`
- the current `HttpReqParam[]`

The utility returns a discriminated result containing either typed arguments or
a user-facing validation error. It does not throw.

`useMcpTestRunController` invokes the utility only for tool operations. On
success, it passes the typed arguments to `McpService.runTool`. On failure, it
sets the existing console error state and does not send a request.

## Conversion Rules

For each argument with a declared property schema:

| Schema type | Conversion |
| --- | --- |
| `string` | Preserve the entered string. |
| `integer` | Parse a finite number and require `Number.isInteger`. |
| `number` | Parse and require a finite number. |
| `boolean` | Accept case-insensitive `true` or `false` only. |
| `object` | Parse JSON and require a non-null, non-array object. |
| `array` | Parse JSON and require an array. |
| `null` | Accept an empty value or the JSON literal `null`. |

Optional empty arguments are omitted. A required empty `string` remains an empty
string, a required empty `null` becomes `null`, and a required empty value with
no declared schema or an unsupported schema type is preserved as an empty
string. Other required empty values are rejected. Invalid values return an error
that identifies the argument and expected type.

Arguments with unsupported or missing schema types remain strings for
compatibility. This matches the fallback behavior of the official MCP Inspector
while making supported conversions strict instead of silently sending invalid
values.

## Error Handling

Conversion failures use a result value rather than exceptions. This avoids the
controller's existing `TypeError` handling, which is reserved for browser CORS
failures.

Example:

```text
Argument "petId" must be an integer.
```

The existing test-console result panel displays the error. No MCP request is
sent.

## Testing

Add focused Vitest coverage for:

- string, integer, number, boolean, object, array, and null conversion
- optional empty argument omission
- required empty argument validation
- fractional integer rejection
- non-finite number rejection
- invalid JSON rejection
- object and array shape mismatches
- unsupported or missing schema type fallback, including required empty-value preservation

The utility is the behavior boundary and can be tested without transport or
React mocks. The controller integration remains a small success/error branch
over the utility result.
