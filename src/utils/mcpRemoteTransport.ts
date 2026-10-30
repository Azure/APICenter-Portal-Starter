import { Remote } from '@/types/server';

/**
 * Converts MCP registry transport names to VS Code's remote transport values.
 *
 * @param remote - MCP remote metadata from either backend contract version.
 * @returns The VS Code transport value, or undefined to use automatic detection.
 */
export function getMcpRemoteTransport(remote?: Remote): 'http' | 'sse' | undefined {
  const type = (remote?.type ?? remote?.transport_type)?.toLowerCase();
  if (type === undefined) return undefined;
  if (type === 'http' || type === 'streamable-http') return 'http';
  if (type === 'sse') return 'sse';
  console.warn(`Unrecognized MCP remote transport "${type}"; VS Code will detect the transport automatically.`);
  return undefined;
}
