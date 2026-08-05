# Copilot Instructions

## Architecture Context

For any request about architecture, system design, component boundaries, data flow, routing, services, state management, authentication, deployment, or folder organization, start with [.wiki/index.md](../.wiki/index.md).

Use [.wiki/index.md](../.wiki/index.md) as the entry point to the architecture documentation set, then follow the linked topic files before making recommendations or code changes.

## Documentation Expectations

- Treat the `.wiki/` documentation as the source of truth for architecture-related context.
- When adding or changing architecture-sensitive behavior, update the relevant `.wiki/` document if the implementation meaningfully changes the documented design.
- For coding and styling conventions, consult [.wiki/guidelines/index.md](../.wiki/guidelines/index.md).

## CoreAI Design System

- Use `@coreai/fluentui-react` as the authoritative component, theme, token, and typography package.
- Import UI components from `@coreai/fluentui-react`, not directly from `@fluentui/react-components`. Continue importing icons from `@fluentui/react-icons`.
- Consult the `storybook-coreai-hosted` MCP server in `.vscode/mcp.json` before implementing or approximating a CoreAI pattern.
- Prefer CoreAI component defaults and Fluent tokens over custom CSS. Do not recreate a component visually when the design system provides it.
- Preserve APIC blue as the primary product identity. Use CoreAI purple selectively for AI-oriented accents rather than as the default page brand.
- Verify light mode, dark mode, keyboard focus, responsive behavior, and accessible labels for every changed pattern.