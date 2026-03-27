---
name: design
description: "Design rules and conventions for the API Center Portal. Use when editing detail pages, card components, badges, layout, navigation, sidebars, or headers. Covers badge styling, metadata placement, page navigation patterns, and layout alignment."
---

# Design Rules

## When to Use
- Editing or creating detail pages (ApiDetailPage, ModelDetailPage, or any page using DetailPageLayout)
- Modifying card components or card click behavior
- Working with badges, pills, or metadata display
- Changing navigation or routing for API/MCP/model items
- Adjusting sidebar content or header layout

## Navigation

- **All cards navigate to full pages.** API cards go to `/apis/:name`, MCP cards go to `/apis/:name`, model cards go to `/languageModels/:name`. Never open a side panel/drawer from a card click.
- **No playground routes.** The model playground feature is removed. Do not add "Open in playground" buttons or links, and do not route to `/languageModels/:name/playground`.
- The `useDesignVariation` hook should NOT be used to toggle between drawer and full-page navigation — full pages are always used.

## Detail Page Layout (DetailPageLayout)

- **Alignment**: All sections must align horizontally — the back link, header (title/summary/badges), tabs, and content area should share the same left edge. The `.header` section must NOT override horizontal padding (the global `main section` rule provides `padding-left: 32px` and `padding-right: 32px`). Only set `padding-top` and `padding-bottom` on `.header`. Never use the shorthand `padding: X 0 Y` which zeros out horizontal padding. This applies to ALL detail pages, including standalone pages like `SkillInfo` that don't use `DetailPageLayout`.
- **Back link**: Always include `< Back to registry` linking to `/`.
- **Header area** contains: title, summary text, metadata badges, and the version/definition selector.
- **Header content order**: Title first, then summary/description text, then metadata badges (tags/pills). This order is consistent across all detail pages (`DetailPageLayout` and standalone pages like `SkillInfo`).
- **Sidebar** contains: additional metadata (contacts, external docs, custom properties). Installation actions live in `headerActions`, not the sidebar.

## Badges / Pills

- **Shape**: All badges in the metadata area must use `shape="circular"` for rounded pill appearance. Never use `shape="rounded"` — it produces square-cornered badges.
- **Primary pill** (card type): Always reflects the high-level category — API, MCP, Skill, Model, Plugin, Agent, etc. Uses `appearance="filled" color="brand" shape="circular"`. For non-standalone kinds (e.g. REST, GraphQL), the category is "API". Rendered via `getCategoryLabel` / same logic on detail pages.
- **Secondary pills** (additional metadata): API protocol (REST, GraphQL, gRPC), lifecycle stage (design, production, retired), custom property tags (Sample, Productivity, etc.). All use `appearance="tint" color="brand" shape="circular"` — matching the card view's secondary pill style.
- **Pill order**: Primary pill first (leftmost), then protocol/kind pill (if non-standalone), then lifecycle stage, then custom property tags, then "Last updated" text last.
- The primary pill tells the user WHAT it is. The secondary pills tell the user MORE ABOUT it.
- All secondary badges must use the same `tint` + `brand` appearance so they look visually consistent with each other and with the card view.

## Custom Properties as Tags

- Extract tag-like values from `api.data.customProperties` and render them as pill badges in the header metadata area.
- **Include**: short strings (≤50 chars), comma-separated string values, string arrays.
- **Exclude**: UUIDs (matching `/^[0-9a-f-]{36}$/i`), URLs (starting with `http://` or `https://`), and known non-tag keys like `sourceUrl`.
- Custom properties ALSO remain visible in the sidebar under "Properties" via the `CustomMetadata` component — tags appear in both places (header as pills, sidebar as labeled values).

## Description / Summary Text

- The API summary/description appears ONLY in the header (via the `summary` prop of `DetailPageLayout`).
- Do NOT render `api.description` as a standalone paragraph in `ApiAdditionalInfo` or the sidebar — it was removed to prevent duplication.

## Sidebar Content

- **Sidebar** contains metadata only: external documentation, contact information, and custom properties (rendered by `ApiAdditionalInfo`).
- Installation actions (MCP, Skill) are NOT in the sidebar — they are in the `headerActions` slot (see Header Actions below).
- If a page has no external docs, contacts, or custom properties, the sidebar is not rendered, giving the main content full width.
- Each sidebar section has a heading with an icon to the left and a bold title (e.g., `<ListRegular />` + **Properties**). The icon and title use `display: inline-flex; align-items: center; gap: 16px`.
- Body content below each heading is indented with `padding-left: 33px` so text aligns directly under the title text (past the icon).
- `ApiAdditionalInfo` renders: external documentation links, contact information, and custom properties.
- It does NOT render the API description (removed to avoid duplication with the header).

## Header Actions

- **All detail pages** use the `headerActions` slot in `DetailPageLayout` for top-level actions.
- The `HeaderActions` component (`src/experiences/HeaderActions`) provides the standard layout: a row of buttons on top, with an optional "Requires API Center extension" hint below.
- **Installable types** (MCP, Skill) show: "Install in VS Code" (primary button with VS Code icon) + "Share" (outline button).
- **Non-installable types** (REST, GraphQL, etc.) show: just "Share".
- **Models** show: just "Share" (install support can be added later).
- The "Install in VS Code" button triggers a `vscode:` deeplink — remote install is preferred over local when both are available.
- The `ShareButton` copies the current page URL to clipboard and shows a "Copied!" tooltip.
- The extension hint only renders when install buttons are present (`showExtensionHint` prop).
