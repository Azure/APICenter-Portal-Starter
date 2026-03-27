# Styling (SCSS) Best Practices

## Styling Model

- Prefer SCSS modules for component-scoped styles.
- Keep styles co-located with the component they support.
- Use global styles only for intentional application-wide concerns such as resets, typography baselines, or shared CSS variables.
- Avoid introducing styling approaches that bypass the established SCSS module pattern unless there is a strong reason.

## Class Naming

- Use descriptive class names that reflect structure or intent.
- Keep nesting shallow and readable.
- Avoid selector chains that depend on fragile DOM structure.
- Prefer explicit modifier classes over overly clever selector combinations.

## Layout And Spacing

- Use layout primitives consistently: flex, grid, gap, and padding should communicate structure clearly.
- Prefer spacing tokens, shared variables, or consistent numeric scales where available.
- Avoid hard-coded dimensions unless the component genuinely requires a fixed size.
- Design for responsive behavior from the start, especially for cards, toolbars, forms, and tables.

## Visual Consistency

- Reuse existing color, border, radius, and shadow patterns before adding new ones.
- Match Fluent UI usage and surrounding app styling rather than introducing isolated visual systems.
- Keep hover, focus, selected, and disabled states visually distinct.
- Avoid one-off overrides that fight component defaults unless they are intentional and documented.

## Maintainability

- Group related selectors together and keep file structure easy to scan.
- Remove dead classes and stale selectors when changing component markup.
- Keep module files focused on a single component or tightly related subparts.
- Prefer clarity over heavy nesting, placeholder abstractions, or prematurely generic mixins.

## Accessibility And Interaction

- Preserve visible focus states for keyboard users.
- Maintain sufficient contrast for text, icons, borders, and interactive states.
- Do not rely on color alone to communicate state.
- Ensure expandable, dismissible, and toggleable UI states have corresponding style states that remain readable.