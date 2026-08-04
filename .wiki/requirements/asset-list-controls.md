# Asset List Controls

## Search Bar

### Search on Enter
- If the user presses **Enter** while focused in the search bar, the search filter is applied immediately.

### Clear Button
- An **X** button is displayed inside the search bar when there is a non-empty value.
- Clicking the X button immediately clears the search bar text and removes the active search filter.

### Empty Search Behavior
- When the search bar value is empty, the `$filter` parameter is removed from the search query so that unfiltered results are returned.

### Autocomplete Suggestions
- The suggestions list is limited to **top 5** results.
- The suggestions dropdown is navigable with **Arrow Up** / **Arrow Down** keys, wrapping around at the ends.
- Pressing **Enter** with an active selection activates that option.
- The active item is visually highlighted.

## Filter Dialog

### Heading
- The filter popover heading is **"Filter"** (not "Custom filter").

### Custom Metadata Properties
- Custom properties from `/metadataSchemas` are included in the filter dropdown alongside built-in filters (API type, Lifecycle).
- Metadata schemas with a fixed value set are shown as filter options. Supported shapes:
  - Top-level `enum` values.
  - Top-level `oneOf` entries (`const` value, optional `description` label).
  - `boolean` type (rendered as Yes/No).
  - **Multi-select** (`type: "array"`) where the value set is defined on `items.enum` or `items.oneOf`.
- Multi-select (array) properties are matched with an OData lambda operator, e.g. `customProperties/tags/any(t: t eq 'Bug')`.
- Filter keys for custom properties use the format `customProperties/{name}`.

