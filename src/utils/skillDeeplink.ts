/**
 * Generates a VS Code deeplink for installing a skill from Azure API Center.
 *
 * Deeplink format:
 *   vscode://apidev.azure-api-center/install?sourceUrl=<encoded>&name=<encoded>
 *
 * This mirrors the MCP install deeplink pattern used by the portal:
 *   vscode:mcp/install?<encoded-json-payload>
 *
 * But for skills we use a URI handler registered by the Azure API Center extension.
 */

const EXTENSION_PUBLISHER = 'apidev';
const EXTENSION_NAME = 'azure-api-center';

export type VsCodeVariant = 'vscode' | 'vscode-insiders';

export interface SkillDeeplinkParams {
  /** GitHub URL pointing to the skill folder */
  sourceUrl: string;
  /** Skill display name */
  name: string;
}

/**
 * Build a deeplink URI that, when opened, triggers the apic-skill-installer
 * extension's URI handler to download and install the skill locally.
 */
export function buildSkillDeeplink(
  params: SkillDeeplinkParams,
  variant: VsCodeVariant = 'vscode'
): string {
  const query = new URLSearchParams({
    sourceUrl: params.sourceUrl,
    name: params.name,
  });

  return `${variant}://${EXTENSION_PUBLISHER}.${EXTENSION_NAME}/install?${query.toString()}`;
}
