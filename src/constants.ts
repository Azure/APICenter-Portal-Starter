import { getRecoil } from 'recoil-nexus';
import { configAtom } from '@/atoms/configAtom';

export const httpMethodsList = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/** Default page size for Data API list requests ($top). */
export const DEFAULT_PAGE_SIZE = 50;

/** Whether the MCP documentation page should use the CORS proxy for server calls. Reads from config.json. */
export function getMcpCorsProxyEnabled(): boolean {
  try {
    const config = getRecoil(configAtom);
    return config?.mcp?.useCorsProxy ?? false;
  } catch {
    return false;
  }
}

/** MCP transport protocol to use for the documentation page. */
export enum McpTransport {
  SSE = 'sse',
  StreamableHttp = 'streamableHttp',
}

export const mcpTransport: McpTransport = McpTransport.StreamableHttp;
