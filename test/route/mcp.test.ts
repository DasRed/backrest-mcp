import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';

vi.hoisted(() => {
    process.env.BACKREST_MCP_AUTH_TOKEN       = 'secret';
    process.env.BACKREST_MCP_BACKREST_URL     = 'http://backrest.test:9898';
    process.env.BACKREST_MCP_READ_ONLY        = 'true';
    process.env.BACKREST_MCP_SERVER_LOG_LEVEL = 'silent';
    process.env.BACKREST_MCP_TOOLS_DENY       = 'get_metrics';
});

vi.mock('@/lib/backrestAPIClient', () => ({
    default: {
        getSummaryDashboard: vi.fn().mockResolvedValue({planSummaries: [{id: 'daily'}]}),
    },
}));

const {default: app}   = await import('@/lib/app');
const {default: route} = await import('@/route/index');

const headers = {accept: 'application/json, text/event-stream', authorization: 'Bearer secret', 'content-type': 'application/json'};

async function rpc(method: string, params: object = {}): Promise<{result: Record<string, unknown>}> {
    const response = await app.inject({headers, method: 'POST', payload: {id: 1, jsonrpc: '2.0', method, params}, url: '/mcp'});

    expect(response.statusCode).toBe(200);

    return response.json();
}

describe('route mcp', () => {
    beforeAll(async () => {
        await app.register(route);
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('answers the health check', async () => {
        const response = await app.inject({method: 'GET', url: '/healthz'});

        expect(response.json()).toEqual({status: 'ok'});
    });

    it('rejects requests without the bearer token', async () => {
        const response = await app.inject({headers: {...headers, authorization: 'Bearer nope'}, method: 'POST', payload: {}, url: '/mcp'});

        expect(response.statusCode).toBe(401);
    });

    it('rejects GET in stateless mode', async () => {
        const response = await app.inject({headers, method: 'GET', url: '/mcp'});

        expect(response.statusCode).toBe(405);
    });

    it('lists only the read-only tools minus the denied ones and calls one', async () => {
        const list  = await rpc('tools/list');
        const names = (list.result.tools as {name: string}[]).map((tool) => tool.name);
        const call  = await rpc('tools/call', {arguments: {}, name: 'get_summary_dashboard'});

        expect(names).toEqual([
            'get_summary_dashboard',
            'get_config',
            'get_operations',
            'watch_operation_events',
            'get_logs',
            'list_snapshots',
            'list_snapshot_files',
            'get_download_url',
            'check_repo_exists',
            'path_autocomplete',
            'get_peer_sync_states',
            'hash_password',
        ]);
        expect(JSON.parse((call.result.content as {text: string}[])[0]!.text)).toEqual({planSummaries: [{id: 'daily'}]});
    });

    it('publishes the server instructions', async () => {
        const initialize = await rpc('initialize', {capabilities: {}, clientInfo: {name: 'test', version: '1'}, protocolVersion: '2025-06-18'});

        expect(initialize.result.instructions).toContain('Backrest');
    });
});
