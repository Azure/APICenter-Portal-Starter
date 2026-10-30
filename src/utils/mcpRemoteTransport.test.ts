import { describe, expect, it } from 'vitest';
import { getMcpRemoteTransport } from './mcpRemoteTransport';

describe('getMcpRemoteTransport', () => {
  it.each([
    [{ type: 'streamable-http', url: 'https://example.com/mcp' }, 'http'],
    [{ transport_type: 'http', url: 'https://example.com/mcp' }, 'http'],
    [{ type: 'sse', url: 'https://example.com/mcp' }, 'sse'],
    [{ transport_type: 'sse', url: 'https://example.com/mcp' }, 'sse'],
  ] as const)('maps remote metadata %o to a VS Code transport', (remote, transport) => {
    expect(getMcpRemoteTransport(remote)).toBe(transport);
  });
});
