/**
 * Generates a VS Code deeplink for installing a skill from Azure API Center.
 *
 * Deeplink format:
 *   vscode://apidev.azure-api-center/install?sourceUrl=<encoded>&name=<encoded>
 *     [&dataApiHost=<host>&workspace=<workspace>&version=<version>&clientId=<id>&tenantId=<id>]
 *
 * When the API Center coordinates are present, the Azure API Center extension (v1.3.7+) downloads the
 * skill package from the API Center data plane; `sourceUrl` (a public GitHub folder) is the fallback.
 */

const EXTENSION_PUBLISHER = 'apidev';
const EXTENSION_NAME = 'azure-api-center';

export type VsCodeVariant = 'vscode' | 'vscode-insiders';

export interface SkillApiCenterSource {
  /** Data API host name, e.g. contoso.data.eastus.azure-apicenter.ms */
  dataApiHost: string;
  /** Workspace name. Defaults to "default". */
  workspace?: string;
  /** Skill version name. Defaults to the latest version. */
  version?: string;
  /** Client ID of the portal app registration used to sign in. */
  clientId: string;
  /** Tenant ID of the portal app registration. */
  tenantId: string;
}

export interface SkillDeeplinkParams {
  /** Skill resource name */
  name: string;
  /** GitHub URL pointing to the skill folder */
  sourceUrl?: string;
  /** API Center data plane coordinates for downloading the skill package */
  apiCenter?: SkillApiCenterSource;
}

/**
 * Build a deeplink URI that, when opened, triggers the Azure API Center
 * extension's URI handler to download and install the skill locally.
 */
export function buildSkillDeeplink(params: SkillDeeplinkParams, variant: VsCodeVariant = 'vscode'): string {
  const query = new URLSearchParams();
  if (params.sourceUrl) {
    query.set('sourceUrl', params.sourceUrl);
  }
  query.set('name', params.name);

  if (params.apiCenter) {
    query.set('dataApiHost', params.apiCenter.dataApiHost);
    query.set('workspace', params.apiCenter.workspace || 'default');
    if (params.apiCenter.version) {
      query.set('version', params.apiCenter.version);
    }
    query.set('clientId', params.apiCenter.clientId);
    query.set('tenantId', params.apiCenter.tenantId);
  }

  return `${variant}://${EXTENSION_PUBLISHER}.${EXTENSION_NAME}/install?${query.toString()}`;
}
