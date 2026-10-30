import { Remote } from '@/types/server';

/**
 * Converts MCP registry transport names to VS Code's remote transport values.
 *
 * @param remote - MCP remote metadata from either backend contract version.
 * @returns The VS Code transport value for this remote.
 */
export function getMcpRemoteTransport(remote?: Remote): 'http' | 'sse' {
  const type = (remote?.type ?? remote?.transport_type)?.toLowerCase();
  return type === 'http' || type === 'streamable-http' ? 'http' : 'sse';
}
