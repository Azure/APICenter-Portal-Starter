---
applyTo: "src/**/*.{ts,tsx,scss}"
---

# CoreAI Design System Implementation

- Use `@coreai/fluentui-react` for UI components, themes, typography, and design tokens.
- Use `@fluentui/react-icons` directly for icons.
- Check `storybook-coreai-hosted` in `.vscode/mcp.json` for the current component API and approved patterns.
- Do not approximate CoreAI components with custom markup or hardcoded styling.
- Use CoreAI/Fluent tokens for color, spacing, typography, borders, radii, and interaction states.
- Keep APIC blue as the primary product accent; reserve purple for selective AI emphasis.
- Test every changed surface in light and dark mode.
- Icon-only controls require an accessible label.
- Preserve visible keyboard focus and sufficient contrast.
