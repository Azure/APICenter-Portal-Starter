import { describe, expect, it, vi } from 'vitest';
import { getMcpRemoteTransport } from './mcpRemoteTransport';

describe('getMcpRemoteTransport', () => {
  it.each([
    [{ type: 'streamable-http', url: 'https://example.com/mcp' }, 'http'],
    [{ type: 'STREAMABLE-HTTP', url: 'https://example.com/mcp' }, 'http'],
    [{ transport_type: 'http', url: 'https://example.com/mcp' }, 'http'],
    [{ type: 'sse', url: 'https://example.com/mcp' }, 'sse'],
    [{ transport_type: 'sse', url: 'https://example.com/mcp' }, 'sse'],
  ] as const)('maps remote metadata %o to a VS Code transport', (remote, transport) => {
    expect(getMcpRemoteTransport(remote)).toBe(transport);
  });

  it('lets VS Code detect the transport when metadata is missing', () => {
    expect(getMcpRemoteTransport()).toBeUndefined();
    expect(getMcpRemoteTransport({ url: 'https://example.com/mcp' })).toBeUndefined();
  });

  it('warns and lets VS Code detect unrecognized transports', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(getMcpRemoteTransport({ type: 'other', url: 'https://example.com/mcp' })).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        'Unrecognized MCP remote transport "other"; VS Code will detect the transport automatically.'
      );
    } finally {
      warn.mockRestore();
    }
  });
});
