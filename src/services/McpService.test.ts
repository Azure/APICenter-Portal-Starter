import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiAuthCredentials } from '@/types/apiAuth';
import { ApiDeployment } from '@/types/apiDeployment';
import { createMcpService, getMcpService, McpService, McpUnauthorizedError } from './McpService';

const mocks = vi.hoisted(() => ({ useProxy: false }));

vi.mock('recoil-nexus', () => ({
  getRecoil: (atom: { key: string }): object => {
    if (atom.key === 'config') {
      return {
        dataApiHostName: 'example.data.test',
        mcp: { useCorsProxy: mocks.useProxy },
      };
    }
    if (atom.key === 'appServices') {
      return { AuthService: { getAccessToken: async (): Promise<string> => 'proxy-token' } };
    }
    throw new Error(`Unexpected atom: ${atom.key}`);
  },
  setRecoil: vi.fn(),
}));

const proxyUrl = 'https://apimanagement-cors-proxy-df.azure-api.net/sendrequest';
const initResult = {
  protocolVersion: '2024-11-05',
  capabilities: {},
  serverInfo: { name: 'test-server', version: '1' },
};
const credentials: ApiAuthCredentials = {
  in: 'header',
  name: 'Authorization',
  value: 'Bearer test-token',
  createdAt: new Date(0),
};

interface UpstreamCall {
  url: string;
  method: string;
  headers: Headers;
  body?: string;
  signal?: AbortSignal | null;
  proxyUrl?: string;
}

function deployment(url: string, transport?: string | null, name = 'deployment'): ApiDeployment {
  return {
    name,
    title: name,
    environmentId: 'environment',
    server: { runtimeUri: [url], mcpTransportProtocol: transport },
  };
}

function response(result: unknown, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function mockRequests(handler: (call: UpstreamCall) => Response | Promise<Response>): UpstreamCall[] {
  const calls: UpstreamCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      const proxyTarget = headers.get('Ocp-Apim-Url');
      const call: UpstreamCall = {
        url: proxyTarget ?? String(input),
        method: headers.get('Ocp-Apim-Method') ?? init.method ?? 'GET',
        headers,
        body: typeof init.body === 'string' ? init.body : undefined,
        signal: init.signal,
        proxyUrl: proxyTarget ? String(input) : undefined,
      };
      calls.push(call);
      return Promise.resolve(handler(call));
    })
  );
  return calls;
}

function sseServer(endpoint: string): {
  connect: (signal?: AbortSignal | null) => Response;
  reply: (call: UpstreamCall, result: unknown) => Response;
  emitEndpoint: (value: string) => void;
  end: () => void;
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

  return {
    connect(signal?: AbortSignal | null): Response {
      signal?.addEventListener(
        'abort',
        () => {
          if (!closed) {
            closed = true;
            controller.close();
          }
        },
        { once: true }
      );
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    },
    reply(call: UpstreamCall, result: unknown): Response {
      const request = JSON.parse(call.body);
      controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify({ id: request.id, result })}\n\n`));
      return new Response(null, { status: 202 });
    },
    emitEndpoint(value: string): void {
      controller.enqueue(encoder.encode(`event: endpoint\ndata: ${value}\n\n`));
    },
    end(): void {
      closed = true;
      controller.close();
    },
  };
}

const activeServices = new Set<McpService>();

function standalone(target: ApiDeployment, auth?: ApiAuthCredentials): McpService {
  const service = createMcpService(target, auth);
  if (!service) throw new Error('Expected MCP service');
  activeServices.add(service);
  return service;
}

function shared(target: ApiDeployment, apiName = 'api', auth?: ApiAuthCredentials): McpService {
  const service = getMcpService(target, apiName, auth);
  if (!service) throw new Error('Expected MCP service');
  activeServices.add(service);
  return service;
}

beforeEach(() => {
  mocks.useProxy = false;
});

afterEach(() => {
  for (const service of activeServices) service.closeConnection();
  activeServices.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.each([
  { label: 'direct', useProxy: false },
  { label: 'CORS proxy', useProxy: true },
])('MCP connections through $label', ({ useProxy }) => {
  beforeEach(() => {
    mocks.useProxy = useProxy;
  });

  it.each([
    'https://host/sqlcl',
    'https://host/custom/prefix/mcp?api-version=1&name=a%2Fb',
    'https://host/custom/',
    'https://host/sqlcl/sse',
  ])('posts Streamable HTTP requests to the exact URL %s', async (url) => {
    const calls = mockRequests((call) => {
      const method = JSON.parse(call.body).method;
      return method === 'initialize'
        ? response(initResult, { 'Mcp-Session-Id': 'session-1' })
        : response({ content: ['ok'] });
    });
    const service = standalone(deployment(url, 'streamable-http'), credentials);

    await expect(service.runTool('tool', {})).resolves.toEqual({ content: ['ok'] });
    expect(calls.map(({ method, url }) => ({ method, url }))).toEqual([
      { method: 'POST', url },
      { method: 'POST', url },
    ]);
    expect(calls.map(({ body }) => JSON.parse(body).method)).toEqual(['initialize', 'tools/call']);
    expect(calls[0].headers.get('Authorization')).toBe('Bearer test-token');
    expect(calls[1].headers.get('Authorization')).toBe('Bearer test-token');
    expect(calls[0].headers.get('Mcp-Session-Id')).toBeNull();
    expect(calls[1].headers.get('Mcp-Session-Id')).toBe('session-1');
    if (useProxy) {
      expect(calls.every((call) => call.proxyUrl === proxyUrl)).toBe(true);
      expect(calls[0].headers.get('Ocp-Apim-Authorization')).toBe('Bearer proxy-token');
      expect(calls[0].headers.get('Ocp-Apim-Service-Name')).toBe('example');
    }
  });

  it('handles Streamable HTTP event-stream responses and updated session headers', async () => {
    const calls = mockRequests((call) => {
      const request = JSON.parse(call.body);
      const result = request.method === 'initialize' ? initResult : { value: request.params.name };
      return new Response(`data: ${JSON.stringify({ jsonrpc: '2.0', id: request.id, result })}\n\n`, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Mcp-Session-Id': request.method === 'initialize' ? 'session-1' : 'session-2',
        },
      });
    });
    const service = standalone(deployment('https://host/sqlcl', 'streamable-http'), credentials);

    await expect(service.runTool('first', {})).resolves.toEqual({ value: 'first' });
    await expect(service.runTool('second', {})).resolves.toEqual({ value: 'second' });
    expect(calls.map((call) => call.headers.get('Mcp-Session-Id'))).toEqual([null, 'session-1', 'session-2']);
    expect(calls.every((call) => call.url === 'https://host/sqlcl' && call.method === 'POST')).toBe(true);
  });

  it('reads matching Streamable HTTP results without waiting for the event stream to close', async () => {
    const canceled: string[] = [];
    const calls = mockRequests((call) => {
      const request = JSON.parse(call.body);
      const result = request.method === 'initialize' ? initResult : { value: '\u20ac' };
      const eventStream =
        ': keep-alive\r\n' +
        'data: {"jsonrpc":"2.0","method":"notifications/progress"}\r\n\r\n' +
        'data: {"jsonrpc":"2.0","id":999,"result":"unrelated"}\r\n\r\n' +
        `data: {"jsonrpc":"2.0","id":${request.id},\r\n` +
        `data: "result":${JSON.stringify(result)}}\r\n\r\n`;
      const bytes = new TextEncoder().encode(eventStream);
      const unicodeIndex = bytes.indexOf(0xe2);
      const stream = new ReadableStream<Uint8Array>({
        start(controller): void {
          if (unicodeIndex >= 0) {
            controller.enqueue(bytes.slice(0, unicodeIndex + 1));
            controller.enqueue(bytes.slice(unicodeIndex + 1));
          } else {
            controller.enqueue(bytes);
          }
          call.signal?.addEventListener('abort', () => controller.error(new Error('aborted')), { once: true });
        },
        cancel(): void {
          canceled.push(request.method);
        },
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    });
    const service = standalone(deployment('https://host/sqlcl?version=1', 'streamable-http'), credentials);

    await expect(service.runTool('tool', {})).resolves.toEqual({ value: '\u20ac' });
    expect(calls.map(({ method, url }) => ({ method, url }))).toEqual([
      { method: 'POST', url: 'https://host/sqlcl?version=1' },
      { method: 'POST', url: 'https://host/sqlcl?version=1' },
    ]);
    expect(canceled).toEqual(['initialize', 'tools/call']);
  });

  it('surfaces errors from matching Streamable HTTP event-stream responses', async () => {
    const calls = mockRequests(
      () =>
        new Response('data: {"jsonrpc":"2.0","id":1,"error":{"message":"initialization failed"}}\n\n', {
          headers: { 'Content-Type': 'text/event-stream' },
        })
    );
    const service = standalone(deployment('https://host/sqlcl', undefined));

    await expect(service.runTool('tool', {})).rejects.toThrow('initialization failed');
    expect(calls.map(({ method }) => method)).toEqual(['POST']);
  });

  it('rejects when a Streamable HTTP event stream ends without a matching response', async () => {
    const calls = mockRequests(
      () =>
        new Response('data: {"jsonrpc":"2.0","id":999,"result":{}}\n\n', {
          headers: { 'Content-Type': 'text/event-stream' },
        })
    );
    const service = standalone(deployment('https://host/sqlcl', 'streamable-http'));

    await expect(service.runTool('tool', {})).rejects.toThrow(
      'No matching JSON-RPC response found in MCP event stream.'
    );
    expect(calls.map(({ method }) => method)).toEqual(['POST']);
  });

  it('cancels a pending Streamable HTTP event stream when the connection closes', async () => {
    let stream: ReadableStream<Uint8Array>;
    const canceled = vi.fn();
    const calls = mockRequests(() => {
      stream = new ReadableStream<Uint8Array>({ cancel: canceled });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    });
    const service = standalone(deployment('https://host/sqlcl', undefined));
    const operation = service.runTool('tool', {});
    await vi.waitFor(() => expect(stream?.locked).toBe(true));

    service.closeConnection();
    await expect(operation).rejects.toThrow('MCP connection closed.');
    expect(canceled).toHaveBeenCalledOnce();
    expect(calls.map(({ method }) => method)).toEqual(['POST']);
  });

  it.each([
    ['https://host/sqlcl', '/sqlcl/messages', 'https://host/sqlcl/messages'],
    ['https://host/sqlcl/sse?api-version=1', '/sqlcl/messages?sessionId=1', 'https://host/sqlcl/messages?sessionId=1'],
    ['https://host/custom/events', 'messages?sessionId=1', 'https://host/custom/messages?sessionId=1'],
    ['https://host/custom/events', '?sessionId=1', 'https://host/custom/events?sessionId=1'],
    ['https://host/custom/events/', 'https://host/elsewhere/message', 'https://host/elsewhere/message'],
  ])('uses the exact SSE URL %s and announced endpoint %s', async (url, endpoint, expectedEndpoint) => {
    const server = sseServer(endpoint);
    const calls = mockRequests((call) => {
      if (call.method === 'GET') return server.connect(call.signal);
      const method = JSON.parse(call.body).method;
      return server.reply(call, method === 'initialize' ? initResult : { content: ['ok'] });
    });
    const service = standalone(deployment(url, 'sse'), credentials);

    await expect(service.runTool('tool', {})).resolves.toEqual({ content: ['ok'] });
    expect(calls.map(({ method, url }) => ({ method, url }))).toEqual([
      { method: 'GET', url },
      { method: 'POST', url: expectedEndpoint },
      { method: 'POST', url: expectedEndpoint },
    ]);
    expect(calls.every((call) => call.headers.get('Authorization') === 'Bearer test-token')).toBe(true);
    expect(calls[0].headers.get('Accept')).toContain('text/event-stream');
    if (useProxy) expect(calls.every((call) => call.proxyUrl === proxyUrl)).toBe(true);
  });

  it.each([undefined, null])('detects Streamable HTTP when transport is %s', async (transport) => {
    const url = 'https://host/sqlcl?query=1';
    const calls = mockRequests((call) =>
      JSON.parse(call.body).method === 'initialize' ? response(initResult) : response({ content: ['ok'] })
    );
    const service = standalone(deployment(url, transport));

    await expect(service.runTool('tool', {})).resolves.toEqual({ content: ['ok'] });
    expect(calls.map(({ method, url }) => ({ method, url }))).toEqual([
      { method: 'POST', url },
      { method: 'POST', url },
    ]);
  });

  it.each([400, 404, 405])('falls back to same-URL SSE only after initialize returns %s', async (status) => {
    const url = 'https://host/sqlcl/sse?api-version=1';
    const server = sseServer('/sqlcl/messages?sessionId=1');
    const calls = mockRequests((call) => {
      if (call.url === url && call.method === 'POST') return new Response(null, { status });
      if (call.method === 'GET') return server.connect(call.signal);
      const method = JSON.parse(call.body).method;
      return server.reply(call, method === 'initialize' ? initResult : { content: ['ok'] });
    });
    const service = standalone(deployment(url));

    await expect(service.runTool('tool', {})).resolves.toEqual({ content: ['ok'] });
    expect(calls.map(({ method, url }) => ({ method, url }))).toEqual([
      { method: 'POST', url },
      { method: 'GET', url },
      { method: 'POST', url: 'https://host/sqlcl/messages?sessionId=1' },
      { method: 'POST', url: 'https://host/sqlcl/messages?sessionId=1' },
    ]);
    expect(calls.filter(({ body }) => body).map(({ body }) => JSON.parse(body).method)).toEqual([
      'initialize',
      'initialize',
      'tools/call',
    ]);
  });

  it.each([400, 404, 405])('does not fall back for explicit Streamable HTTP on %s', async (status) => {
    const calls = mockRequests(() => new Response(null, { status }));
    const service = standalone(deployment('https://host/sqlcl', 'streamable-http'));

    await expect(service.collectMcpSpec()).rejects.toThrow(String(status));
    expect(calls.map(({ method }) => method)).toEqual(['POST']);
  });

  it.each([401, 403, 429, 500, 502, 503])('does not fall back from initialize on %s', async (status) => {
    const calls = mockRequests(() => new Response(null, { status }));
    const service = standalone(deployment('https://host/sqlcl'));

    await expect(service.collectMcpSpec()).rejects.toThrow();
    expect(calls.map(({ method }) => method)).toEqual(['POST']);
  });

  it('preserves the Streamable HTTP initialize 401 challenge without falling back', async () => {
    const calls = mockRequests(
      () => new Response(null, { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="mcp"' } })
    );
    const service = standalone(deployment('https://host/sqlcl'));

    await expect(service.collectMcpSpec()).rejects.toMatchObject({
      name: 'McpUnauthorizedError',
      wwwAuthenticate: 'Bearer realm="mcp"',
    });
    expect(calls.map(({ method }) => method)).toEqual(['POST']);
  });

  it.each([new TypeError('Failed to fetch'), new DOMException('Timed out', 'TimeoutError')])(
    'does not fall back after a network error or timeout',
    async (error) => {
      const calls = mockRequests(() => Promise.reject(error));
      const service = standalone(deployment('https://host/sqlcl'));

      await expect(service.collectMcpSpec()).rejects.toBe(error);
      expect(calls.map(({ method }) => method)).toEqual(['POST']);
    }
  );

  it.each([400, 404, 405])('does not retry a tool call on %s', async (status) => {
    const calls = mockRequests((call) =>
      JSON.parse(call.body).method === 'initialize' ? response(initResult) : new Response(null, { status })
    );
    const service = standalone(deployment('https://host/sqlcl'));

    await expect(service.runTool('tool', {})).rejects.toThrow(String(status));
    expect(calls.map(({ method }) => method)).toEqual(['POST', 'POST']);
    expect(calls.map(({ body }) => JSON.parse(body).method)).toEqual(['initialize', 'tools/call']);
  });

  it.each([400, 404, 405])('does not retry an SSE tool call on %s', async (status) => {
    const server = sseServer('/sqlcl/messages');
    const calls = mockRequests((call) => {
      if (call.method === 'GET') return server.connect(call.signal);
      return JSON.parse(call.body).method === 'initialize'
        ? server.reply(call, initResult)
        : new Response(null, { status });
    });
    const service = standalone(deployment('https://host/sqlcl/sse', 'sse'), credentials);

    await expect(service.runTool('tool', {})).rejects.toThrow(String(status));
    expect(calls.map(({ method }) => method)).toEqual(['GET', 'POST', 'POST']);
    expect(calls.filter(({ body }) => body).map(({ body }) => JSON.parse(body).method)).toEqual([
      'initialize',
      'tools/call',
    ]);
  });

  it.each(['future-transport', ''])(
    'rejects unknown explicit transport %s without network traffic',
    async (transport) => {
      const calls = mockRequests(() => response(initResult));
      const service = standalone(deployment('https://host/sqlcl', transport));

      await expect(service.collectMcpSpec()).rejects.toThrow(/unsupported MCP transport/i);
      expect(calls).toHaveLength(0);
    }
  );

  it.each([
    ['invalid JSON', '{'],
    ['JSON-RPC error', '{"jsonrpc":"2.0","id":1,"error":{"message":"bad initialize"}}'],
    ['missing result', '{"jsonrpc":"2.0","id":1}'],
  ])('does not fall back after an HTTP 200 with %s', async (_label, body) => {
    const calls = mockRequests(() => new Response(body, { headers: { 'Content-Type': 'application/json' } }));
    const service = standalone(deployment('https://host/sqlcl'));

    await expect(service.collectMcpSpec()).rejects.toThrow();
    expect(calls.map(({ method }) => method)).toEqual(['POST']);
  });

  it('reports the SSE status when compatibility fallback also fails', async () => {
    const calls = mockRequests(() => new Response(null, { status: 404 }));
    const service = standalone(deployment('https://host/sqlcl'));

    await expect(service.collectMcpSpec()).rejects.toThrow('404');
    expect(calls.map(({ method }) => method)).toEqual(['POST', 'GET']);
  });

  it('preserves the SSE GET 401 challenge and stops reconnecting', async () => {
    const calls = mockRequests(
      () =>
        new Response(null, {
          status: 401,
          headers: { 'WWW-Authenticate': 'Bearer resource_metadata="https://host/auth"' },
        })
    );
    const service = standalone(deployment('https://host/sqlcl/sse', 'sse'));

    await expect(service.collectMcpSpec()).rejects.toMatchObject({
      name: 'McpUnauthorizedError',
      wwwAuthenticate: 'Bearer resource_metadata="https://host/auth"',
    });
    expect(calls.map(({ method }) => method)).toEqual(['GET']);
  });

  it('preserves the SSE message POST 401 challenge', async () => {
    const server = sseServer('/sqlcl/messages');
    const calls = mockRequests((call) =>
      call.method === 'GET'
        ? server.connect(call.signal)
        : new Response(null, { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="mcp"' } })
    );
    const service = standalone(deployment('https://host/sqlcl/sse', 'sse'));

    await expect(service.collectMcpSpec()).rejects.toMatchObject({
      name: 'McpUnauthorizedError',
      wwwAuthenticate: 'Bearer realm="mcp"',
    });
    expect(calls.map(({ method }) => method)).toEqual(['GET', 'POST']);
  });

  it.each(['https://elsewhere.test/messages', '//elsewhere.test/messages', 'https://user:pass@host/messages'])(
    'rejects unsafe SSE message endpoint %s before forwarding credentials',
    async (endpoint) => {
      const server = sseServer(endpoint);
      const calls = mockRequests((call) => server.connect(call.signal));
      const service = standalone(deployment('https://host/sqlcl/sse', 'sse'), credentials);

      await expect(service.collectMcpSpec()).rejects.toThrow(/origin/i);
      expect(calls.map(({ method }) => method)).toEqual(['GET']);
    }
  );

  it('does not initialize twice for duplicate SSE endpoint events', async () => {
    const server = sseServer('/sqlcl/messages');
    const calls = mockRequests((call) => {
      if (call.method === 'GET') return server.connect(call.signal);
      return server.reply(call, initResult);
    });
    const service = standalone(deployment('https://host/sqlcl/sse', 'sse'));

    await service.collectMcpSpec();
    server.emitEndpoint('/sqlcl/messages');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(calls.map(({ method }) => method)).toEqual(['GET', 'POST']);
  });

  it('reinitializes after SSE reconnect without retrying pending operations', async () => {
    const first = sseServer('/sqlcl/messages?sessionId=1');
    const second = sseServer('/sqlcl/messages?sessionId=2');
    let connections = 0;
    const calls = mockRequests((call) => {
      if (call.method === 'GET') {
        connections += 1;
        return (connections === 1 ? first : second).connect(call.signal);
      }
      const method = JSON.parse(call.body).method;
      if (call.url.endsWith('sessionId=1') && method === 'tools/call') {
        return new Response(null, { status: 202 });
      }
      return (call.url.endsWith('sessionId=1') ? first : second).reply(
        call,
        method === 'initialize' ? initResult : { value: 'new session' }
      );
    });
    const service = standalone(deployment('https://host/sqlcl/sse', 'sse'), credentials);

    await service.collectMcpSpec();
    const oldRequest = service.runTool('first', {});
    await vi.waitFor(() => expect(calls).toHaveLength(3));
    const rejected = expect(oldRequest).rejects.toThrow(/connection/i);
    first.end();
    await rejected;

    const newRequest = service.runTool('second', {});
    await vi.waitFor(() => expect(connections).toBe(2), { timeout: 6000, interval: 100 });
    await expect(newRequest).resolves.toEqual({ value: 'new session' });
    expect(calls.map(({ method }) => method)).toEqual(['GET', 'POST', 'POST', 'GET', 'POST', 'POST']);
    expect(calls.filter(({ body }) => body && JSON.parse(body).method === 'tools/call')).toHaveLength(2);
    expect(calls[4].url).toBe('https://host/sqlcl/messages?sessionId=2');
    expect(calls[5].url).toBe('https://host/sqlcl/messages?sessionId=2');
    expect(calls.every((call) => call.headers.get('Authorization') === 'Bearer test-token')).toBe(true);
  });
});

describe('MCP service lifecycle', () => {
  it.each([false, true])('prevents a late 404 from opening SSE after close (proxy: %s)', async (useProxy) => {
    mocks.useProxy = useProxy;
    let finishRequest: (response: Response) => void;
    const calls = mockRequests(() => new Promise<Response>((resolve) => (finishRequest = resolve)));
    const service = standalone(deployment('https://host/sqlcl'));
    const pending = service.collectMcpSpec();

    await vi.waitFor(() => expect(calls).toHaveLength(1));
    service.closeConnection();
    await expect(pending).rejects.toThrow(/closed/i);
    finishRequest(new Response(null, { status: 404 }));
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(calls.map(({ method }) => method)).toEqual(['POST']);
    expect(calls[0].signal?.aborted).toBe(true);
  });

  it('replaces shared connections when deployment, API, or transport changes', async () => {
    mockRequests(() => response(initResult));
    const firstDeployment = deployment('https://host/sqlcl', 'streamable-http', 'first');
    const first = shared(firstDeployment, 'api-a', credentials);
    await first.collectMcpSpec();
    expect(shared(firstDeployment, 'api-a')).toBe(first);

    const second = shared(deployment('https://host/sqlcl', 'streamable-http', 'second'), 'api-a');
    expect(second).not.toBe(first);
    await second.collectMcpSpec();

    const third = shared(deployment('https://host/sqlcl', 'streamable-http', 'second'), 'api-b');
    expect(third).not.toBe(second);
    await third.collectMcpSpec();

    const fourth = shared(deployment('https://host/sqlcl', 'unknown', 'second'), 'api-b');
    expect(fourth).not.toBe(third);
    await expect(fourth.collectMcpSpec()).rejects.toThrow(/unknown/i);
  });

  it('replaces failed shared connections and keeps standalone cleanup separate', async () => {
    let count = 0;
    mockRequests(() => (++count === 1 ? new Response(null, { status: 500 }) : response(initResult)));
    const target = deployment('https://host/sqlcl', 'streamable-http');
    const first = shared(target);
    await expect(first.collectMcpSpec()).rejects.toThrow('500');

    const second = shared(target);
    expect(second).not.toBe(first);
    await second.collectMcpSpec();
    const independent = standalone(target);
    await independent.collectMcpSpec();
    independent.closeConnection();
    expect(shared(target)).toBe(second);
  });

  it('rejects a late Streamable HTTP tool response after close', async () => {
    let finishTool: (value: Response) => void;
    const calls = mockRequests((call) =>
      JSON.parse(call.body).method === 'initialize'
        ? response(initResult)
        : new Promise<Response>((resolve) => (finishTool = resolve))
    );
    const service = standalone(deployment('https://host/sqlcl', 'streamable-http'));
    const pending = service.runTool('tool', {});
    await vi.waitFor(() => expect(calls).toHaveLength(2));

    service.closeConnection();
    finishTool(response({ value: 'stale' }));
    await expect(pending).rejects.toThrow(/closed/i);
    expect(calls[1].signal?.aborted).toBe(true);
  });

  it('preserves Streamable HTTP 401 challenges', async () => {
    mockRequests(() => new Response(null, { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="mcp"' } }));
    const service = standalone(deployment('https://host/sqlcl', 'streamable-http'));

    const error = await service.collectMcpSpec().catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(McpUnauthorizedError);
    expect(error).toMatchObject({ wwwAuthenticate: 'Bearer realm="mcp"' });
  });
});
