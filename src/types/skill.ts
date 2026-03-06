/**
 * Skill type definition for Azure API Center.
 *
 * A "skill" is a reusable AI capability (prompt template, tool definition, etc.)
 * that can be installed into a local workspace from a GitHub repository.
 *
 * APIs of kind "skill" have a `sourceUrl` custom property that points to the
 * skill folder in a GitHub repository.
 */

export interface SkillMetadata {
  /** Display name of the skill */
  name: string;
  /** Human-readable title */
  title?: string;
  /** Markdown description of what the skill does */
  description?: string;
  /** GitHub URL pointing to the skill folder (e.g. https://github.com/owner/repo/tree/main/skills/my-skill) */
  sourceUrl: string;
  /** Optional tags for categorization */
  tags?: string[];
  /** Optional author information */
  author?: string;
  /** Optional version string */
  version?: string;
}

/**
 * The structure of a skill.json manifest file found at the root of a skill folder.
 */
export interface SkillManifest {
  /** Schema version */
  $schema?: string;
  /** Skill identifier */
  name: string;
  /** Human-readable title */
  title: string;
  /** Markdown description */
  description: string;
  /** Skill version */
  version: string;
  /** Author or organization */
  author?: string;
  /** List of files included in the skill */
  files?: string[];
  /** Tags for discoverability */
  tags?: string[];
  /** Optional dependencies */
  dependencies?: Record<string, string>;
}
