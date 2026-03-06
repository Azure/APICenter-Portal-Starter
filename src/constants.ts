export const httpMethodsList = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/** Default page size for Data API list requests ($top). */
export const DEFAULT_PAGE_SIZE = 50;

/** Whether the MCP documentation page should use the CORS proxy for server calls. */
export const useCorsProxy: boolean = false;

/** MCP transport protocol to use for the documentation page. */
export enum McpTransport {
  SSE = 'sse',
  StreamableHttp = 'streamableHttp',
}

export const mcpTransport: McpTransport = McpTransport.StreamableHttp;
