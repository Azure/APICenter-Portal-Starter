import { LocationsService } from '@/services/LocationsService';
import { HomeLocationState } from '@/types/homeDrawer';

interface PluginResourceNavigation {
  to: string;
  state?: HomeLocationState;
}

/**
 * Resolves the detail-page navigation target for a resource listed by a plugin.
 *
 * @param name - The resource name used by its detail route.
 * @param kind - The API Center resource kind.
 * @returns The route and optional navigation state for the resource.
 */
export function getPluginResourceNavigation(name: string, kind?: string): PluginResourceNavigation {
  const normalizedKind = kind?.toLowerCase();
  if (normalizedKind === 'agent') return { to: LocationsService.getAgentInfoUrl(name) };
  if (normalizedKind === 'skill') return { to: LocationsService.getSkillInfoUrl(name) };
  if (normalizedKind === 'mcp') return { to: LocationsService.getMcpServerUrl(name) };
  if (normalizedKind === 'model' || normalizedKind === 'languagemodel') {
    return { to: LocationsService.getModelDetailUrl(name) };
  }

  return {
    to: LocationsService.getHomeUrl(true),
    state: { drawer: { kind: 'api', name } },
  };
}
