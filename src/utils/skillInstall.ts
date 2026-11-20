import { ApiMetadata } from '@/types/api';
import { Config } from '@/types/config';
import { SkillDeeplinkParams } from '@/utils/skillDeeplink';

function nonBlank(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Returns the skill's source folder URL: an explicit `customProperties.sourceUrl` override,
 * otherwise the folder URL that API Center resolved from the skill's Git source.
 */
export function getSkillSourceUrl(api?: Pick<ApiMetadata, 'customProperties' | 'source'>): string | undefined {
  return nonBlank(api?.customProperties?.['sourceUrl']) ?? nonBlank(api?.source?.url);
}

/** Normalizes a configured Data API host name ("https://host/" or "host") to a bare host name. */
function toHostName(dataApiHostName: string | undefined): string | undefined {
  const value = nonBlank(dataApiHostName);
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value.includes('://') ? value : `https://${value}`).host || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Builds the "Install in VS Code" deeplink parameters for a skill, or returns undefined when the skill cannot be installed.
 * Portals with Entra ID authentication let the extension download the skill package from API Center; otherwise a
 * GitHub source folder URL is required.
 */
export function getSkillInstallParams(
  api: Pick<ApiMetadata, 'name' | 'customProperties' | 'source'> | undefined,
  config: Pick<Config, 'dataApiHostName' | 'authentication'>,
  version?: string
): SkillDeeplinkParams | undefined {
  if (!api?.name) {
    return undefined;
  }

  const sourceUrl = getSkillSourceUrl(api);
  const dataApiHost = toHostName(config.dataApiHostName);
  const clientId = nonBlank(config.authentication?.clientId);
  const tenantId = nonBlank(config.authentication?.tenantId);
  const apiCenter =
    dataApiHost && clientId && tenantId
      ? { dataApiHost, clientId, tenantId, workspace: 'default', version }
      : undefined;

  if (!sourceUrl && !apiCenter) {
    return undefined;
  }

  return { name: api.name, sourceUrl, apiCenter };
}
