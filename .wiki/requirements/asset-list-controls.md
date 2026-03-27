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
- Only metadata schemas with **enum** values are shown as filter options.
- Filter keys for custom properties use the format `customProperties/{name}`.
