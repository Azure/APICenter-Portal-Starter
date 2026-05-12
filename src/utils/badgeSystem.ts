import type { BadgeProps } from '@fluentui/react-components';

/**
 * Badge design system — consistent visual hierarchy across all pages.
 *
 * Tier 1 – Identity:  filled / brand / circular   (MCP, API, Agent…)
 * Tier 2 – Sub-type:  tint   / brand / circular   (REST, GraphQL…)
 * Tier 3 – Lifecycle: tint   / semantic / circular  (production → success, preview → warning…)
 * Tier 4 – Transport: tint   / brand / circular    (Local, Remote, Local + Remote — same as sub-type)
 * Tier 5 – Tags:      tint   / informative / circular (user custom properties)
 */

type SemanticColor = NonNullable<BadgeProps['color']>;

const LIFECYCLE_COLORS: Record<string, SemanticColor> = {
  production: 'success',
  ga: 'success',
  stable: 'success',
  preview: 'brand',
  beta: 'brand',
  testing: 'brand',
  deprecated: 'severe',
  retired: 'danger',
  development: 'informative',
  design: 'informative',
};

export function getLifecycleBadgeColor(stage?: string): SemanticColor {
  if (!stage) return 'informative';
  return LIFECYCLE_COLORS[stage.toLowerCase()] ?? 'informative';
}
