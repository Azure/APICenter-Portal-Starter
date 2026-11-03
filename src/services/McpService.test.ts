import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiAuthCredentials } from '@/types/apiAuth';
import { ApiDeployment } from '@/types/apiDeployment';
import { createMcpService, getMcpService, McpService } from './McpService';

const config = vi.hoisted(() => ({ useProxy: false }));
vi.mock('recoil-nexus', () => ({
  getRecoil: (atom: { key: string }): object =>
    atom.key === 'config'
      ? { dataApiHostName: 'example.data.test', mcp: { useCorsProxy: config.useProxy } }
      : { AuthService: { getAccessToken: async (): Promise<string> => 'proxy-token' } },
  setRecoil: vi.fn(),
}));

const initResult = { capabilities: {}, protocolVersion: '2024-11-05' };
const credentials: ApiAuthCredentials = {
  in: 'header',
  name: 'Authorization',
  value: 'test-token',
  createdAt: new Date(0),
};

interface Call {
  url: string;
  method: string;
  headers: Headers;
  payload?: { id: number; method: string };
  signal?: AbortSignal | null;
}

function deployment(uri = 'https://host/sqlcl', transport?: string | null, name = 'deployment'): ApiDeployment {
  return {
    name,
    title: name,
    environmentId: 'environment',
    server: { runtimeUri: [uri], mcpTransportProtocol: transport },
  };
}

function response(result: unknown = initResult, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify({ id: 1, jsonrpc: '2.0', result }), {
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function requests(handler: (call: Call) => Response | Promise<Response>): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((url: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      const call: Call = {
        url: headers.get('Ocp-Apim-Url') ?? String(url),
        method: headers.get('Ocp-Apim-Method') ?? init.method ?? 'GET',
        headers,
        payload: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
        signal: init.signal,
      };
      calls.push(call);
      return Promise.resolve(handler(call));
    })
  );
  return calls;
}

function sseServer(endpoint: string): {
  connect: (signal?: AbortSignal | null) => Response;
  reply: (call: Call) => Response;
} {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    start(value): void {
      controller = value;
      controller.enqueue(encoder.encode(`event: endpoint\ndata: ${endpoint}\n\n`));
    },
  });
  const end = (): void => {
    if (!closed) {
      closed = true;
      controller.close();
    }
  };
  return {
    connect(signal): Response {
      signal?.addEventListener('abort', end, { once: true });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    },
    reply(call): Response {
      const result = call.payload.method === 'initialize' ? initResult : { ok: true };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ id: call.payload.id, result })}\n\n`));
      return new Response(null, { status: 202 });
    },
  };
}

const services = new Set<McpService>();
function client(target: ApiDeployment, shared = false, auth = credentials, key = 'api'): McpService {
  const uri = target.server.runtimeUri[0];
  const transport = target.server.mcpTransportProtocol;
  const service = shared
    ? getMcpService(uri, auth, transport, JSON.stringify([key, target.name]))
    : createMcpService(uri, auth, transport);
  if (!service) throw new Error('Expected MCP service');
  services.add(service);
  return service;
}
beforeEach(() => {
  config.useProxy = false;
});
afterEach(() => {
  services.forEach((service) => service.closeConnection());
  services.clear();
  vi.unstubAllGlobals();
});

describe.each([false, true])('MCP requests (proxy: %s)', (useProxy) => {
  beforeEach(() => {
    config.useProxy = useProxy;
  });

  it.each(['https://host/sqlcl', 'https://host/prefix/mcp?q=a%2Fb', 'https://host/custom/', 'https://host/sqlcl/sse'])(
    'preserves the Streamable HTTP endpoint %s and auth/session headers',
    async (url) => {
      const calls = requests(() => response(initResult, { 'MCP-Session-Id': 'session-1' }));
      await client(deployment(url, 'streamable-http')).runTool('tool', {});
      expect(calls.map((c) => [c.method, c.url, c.payload.method])).toEqual([
        ['POST', url, 'initialize'],
        ['POST', url, 'tools/call'],
      ]);
      expect(calls.map((c) => c.headers.get('MCP-Session-Id'))).toEqual([null, 'session-1']);
      expect(calls.every((c) => c.headers.get('Authorization') === credentials.value)).toBe(true);
      expect(calls[0].headers.get('Accept')).toBe('application/json, text/event-stream');
      if (useProxy) expect(calls[0].headers.get('Ocp-Apim-Authorization')).toBe('Bearer proxy-token');
    }
  );

  it.each([
    ['https://host/sqlcl/sse?q=a%2Fb', '/sqlcl/messages?session=1', 'https://host/sqlcl/messages?session=1'],
    ['https://host/custom/events', 'messages?session=1', 'https://host/custom/messages?session=1'],
    ['https://host/custom/', 'https://host/other/messages?q=1', 'https://host/other/messages?q=1'],
    ['https://host/sqlcl/sse', 'https://message-host/messages?session=1', 'https://message-host/messages?session=1'],
  ])('uses the exact SSE URL %s and announced endpoint', async (url, endpoint, resolved) => {
    const server = sseServer(endpoint);
    const calls = requests((c) => (c.method === 'GET' ? server.connect(c.signal) : server.reply(c)));
    await client(deployment(url, 'sse')).runTool('tool', {});
    expect(calls.map((c) => [c.method, c.url])).toEqual([
      ['GET', url],
      ['POST', resolved],
      ['POST', resolved],
    ]);
    expect(calls.every((c) => c.headers.get('Authorization') === credentials.value)).toBe(true);
    expect(calls[0].headers.get('Accept')).toBe('text/event-stream');
  });

  it.each([undefined, null])('detects Streamable HTTP for absent metadata (%s)', async (transport) => {
    const calls = requests(() => response());
    await client(deployment('https://host/sqlcl?q=1', transport)).runTool('tool', {});
    expect(calls.map((c) => [c.method, c.url])).toEqual([
      ['POST', 'https://host/sqlcl?q=1'],
      ['POST', 'https://host/sqlcl?q=1'],
    ]);
  });

  it.each([400, 404, 405])('falls back only from initialization on %s', async (status) => {
    const url = 'https://host/sqlcl/sse?q=1';
    const server = sseServer('/sqlcl/messages');
    const calls = requests((c) =>
      c.method === 'GET' ? server.connect(c.signal) : c.url === url ? new Response(null, { status }) : server.reply(c)
    );
    await client(deployment(url)).runTool('tool', {});
    expect(calls.map((c) => [c.method, c.url])).toEqual([
      ['POST', url],
      ['GET', url],
      ['POST', 'https://host/sqlcl/messages'],
      ['POST', 'https://host/sqlcl/messages'],
    ]);
    expect(calls.filter((c) => c.payload).map((c) => c.payload.method)).toEqual([
      'initialize',
      'initialize',
      'tools/call',
    ]);
  });

  it.each([401, 403, 429, 500, 502, 503])('never falls back on HTTP %s', async (status) => {
    const calls = requests(() => new Response(null, { status }));
    await expect(client(deployment()).runTool('tool', {})).rejects.toThrow();
    expect(calls.map((c) => c.method)).toEqual(['POST']);
  });

  it.each([new TypeError('Failed to fetch'), new DOMException('Timeout', 'TimeoutError')])(
    'never falls back on network errors or timeouts',
    async (error) => {
      const calls = requests(() => Promise.reject(error));
      await expect(client(deployment()).runTool('tool', {})).rejects.toBe(error);
      expect(calls.map((c) => c.method)).toEqual(['POST']);
    }
  );

  it.each([400, 404, 405])('respects explicit Streamable HTTP on %s', async (status) => {
    const calls = requests(() => new Response(null, { status }));
    await expect(client(deployment(undefined, 'streamable-http')).runTool('tool', {})).rejects.toThrow();
    expect(calls.map((c) => c.method)).toEqual(['POST']);
  });

  it.each([400, 404, 405])('never retries a user operation on %s', async (status) => {
    const calls = requests((c) => (c.payload.method === 'initialize' ? response() : new Response(null, { status })));
    await expect(client(deployment()).runTool('tool', {})).rejects.toThrow();
    expect(calls.map((c) => c.payload.method)).toEqual(['initialize', 'tools/call']);
  });

  it.each(['', 'unknown'])('diagnoses explicit unknown transport %s without requests', async (transport) => {
    const calls = requests(() => response());
    await expect(client(deployment(undefined, transport)).collectMcpSpec()).rejects.toThrow(
      /Unsupported MCP transport/
    );
    expect(calls).toEqual([]);
  });

  it.each(['GET', 'POST'])('preserves SSE %s 401 challenges', async (method) => {
    const server = sseServer('/sqlcl/messages');
    const calls = requests((c) =>
      c.method === method
        ? new Response(null, { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="mcp"' } })
        : server.connect(c.signal)
    );
    await expect(client(deployment(undefined, 'sse')).collectMcpSpec()).rejects.toMatchObject({
      name: 'McpUnauthorizedError',
      wwwAuthenticate: 'Bearer realm="mcp"',
    });
    expect(calls.map((c) => c.method)).toEqual(method === 'GET' ? ['GET'] : ['GET', 'POST']);
  });

  it('prevents late initialization from starting fallback after close', async () => {
    let finish: (response: Response) => void;
    const calls = requests(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    const service = client(deployment());
    const pending = service.runTool('tool', {});
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    service.closeConnection();
    await expect(pending).rejects.toThrow(/closed/);
    finish(new Response(null, { status: 404 }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(calls).toHaveLength(1);
    expect(calls[0].payload.method).toBe('initialize');
  });
});

it('isolates shared deployment/transport/definition/auth identity and standalone cleanup', async () => {
  requests(() => response());
  const target = deployment(undefined, 'streamable-http');
  const first = client(target, true);
  await first.collectMcpSpec();
  const reuse = (): McpService | undefined =>
    getMcpService(
      target.server.runtimeUri[0],
      undefined,
      target.server.mcpTransportProtocol,
      JSON.stringify(['api', target.name])
    );
  expect(reuse()).toBe(first);
  expect(client({ ...target }, true)).toBe(first);
  client(target).closeConnection();
  expect(reuse()).toBe(first);
  const second = client({ ...target, name: 'another' }, true);
  expect(first.isClosed).toBe(true);
  const third = client(target, true, credentials, 'another-api');
  expect(second.isClosed).toBe(true);
  const changedCredentials = { ...credentials };
  const fourth = client(target, true, changedCredentials, 'another-api');
  expect(third.isClosed).toBe(true);
  target.server.mcpTransportProtocol = 'unknown';
  await expect(client(target, true, changedCredentials, 'another-api').collectMcpSpec()).rejects.toThrow(/Unsupported/);
  expect(fourth.isClosed).toBe(true);
});
