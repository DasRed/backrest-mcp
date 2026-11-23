import type BackrestAPIClient from '@/service/BackrestAPIClient';
import MCPToolAddRepo from '@/service/mcp/MCPToolAddRepo';
import MCPToolCancelOperation from '@/service/mcp/MCPToolCancelOperation';
import MCPToolCheckRepoExists from '@/service/mcp/MCPToolCheckRepoExists';
import MCPToolClearHistory from '@/service/mcp/MCPToolClearHistory';
import MCPToolForgetSnapshots from '@/service/mcp/MCPToolForgetSnapshots';
import MCPToolGeneratePairingToken from '@/service/mcp/MCPToolGeneratePairingToken';
import MCPToolGetConfig from '@/service/mcp/MCPToolGetConfig';
import MCPToolGetDownloadURL from '@/service/mcp/MCPToolGetDownloadURL';
import MCPToolGetLogs from '@/service/mcp/MCPToolGetLogs';
import MCPToolGetMetrics from '@/service/mcp/MCPToolGetMetrics';
import MCPToolGetOperations from '@/service/mcp/MCPToolGetOperations';
import MCPToolGetPeerSyncStates from '@/service/mcp/MCPToolGetPeerSyncStates';
import MCPToolGetSummaryDashboard from '@/service/mcp/MCPToolGetSummaryDashboard';
import MCPToolHashPassword from '@/service/mcp/MCPToolHashPassword';
import MCPToolListSnapshotFiles from '@/service/mcp/MCPToolListSnapshotFiles';
import MCPToolListSnapshots from '@/service/mcp/MCPToolListSnapshots';
import MCPToolPathAutocomplete from '@/service/mcp/MCPToolPathAutocomplete';
import MCPToolRemoveRepo from '@/service/mcp/MCPToolRemoveRepo';
import MCPToolRestoreSnapshot from '@/service/mcp/MCPToolRestoreSnapshot';
import MCPToolRunCommand from '@/service/mcp/MCPToolRunCommand';
import MCPToolRunRepoTask from '@/service/mcp/MCPToolRunRepoTask';
import MCPToolSetConfig from '@/service/mcp/MCPToolSetConfig';
import MCPToolSetRemoteClientConfig from '@/service/mcp/MCPToolSetRemoteClientConfig';
import MCPToolSetupSFTP from '@/service/mcp/MCPToolSetupSFTP';
import MCPToolStartBackup from '@/service/mcp/MCPToolStartBackup';
import MCPToolWatchOperationEvents from '@/service/mcp/MCPToolWatchOperationEvents';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {describe, expect, it, vi} from 'vitest';
import {z} from 'zod';

// every client method resolves; the result depends on the method so the tools can work with it
const calls: string[] = [];
const client          = new Proxy({}, {
    get: (_target, method: string) => vi.fn(async () => {
        calls.push(method);

        return ({
            getConfig:     {repos: [{guid: 'g', id: 'nas'}]},
            getLogs:       'log',
            getOperation:  {id: '1', logref: 'ref'},
            getOperations: [{id: '1', operationIndexSnapshot: {}}],
            runCommand:    '1',
        } as Record<string, unknown>)[method] ?? {};
    }),
}) as unknown as BackrestAPIClient;

const TOOLS: [new (client: BackrestAPIClient) => {call(args: Record<string, unknown>): Promise<{isError?: boolean}>; inputSchema: Record<string, z.ZodType>; name: string; register(server: McpServer): unknown}, Record<string, unknown>, string][] = [
    [MCPToolAddRepo, {repo: {id: 'nas', password: 'pw', uri: '/b'}}, 'addRepo'],
    [MCPToolCancelOperation, {operation_id: '1'}, 'cancel'],
    [MCPToolCheckRepoExists, {repo: {id: 'nas', password: 'pw', uri: '/b'}}, 'checkRepoExists'],
    [MCPToolClearHistory, {plan_id: 'daily'}, 'clearHistory'],
    [MCPToolForgetSnapshots, {plan_id: 'daily', repo_id: 'nas'}, 'forget'],
    [MCPToolGeneratePairingToken, {label: 'eros'}, 'generatePairingToken'],
    [MCPToolGetConfig, {}, 'getConfig'],
    [MCPToolGetDownloadURL, {operation_id: '1'}, 'getDownloadURL'],
    [MCPToolGetLogs, {ref: 'ref'}, 'getLogs'],
    [MCPToolGetMetrics, {}, 'getMetrics'],
    [MCPToolGetOperations, {plan_id: 'daily'}, 'getOperations'],
    [MCPToolGetPeerSyncStates, {}, 'getPeerSyncStates'],
    [MCPToolGetSummaryDashboard, {}, 'getSummaryDashboard'],
    [MCPToolHashPassword, {password: 'pw'}, 'hashPassword'],
    [MCPToolListSnapshotFiles, {repo_id: 'nas', snapshot_id: 'abc'}, 'listSnapshotFiles'],
    [MCPToolListSnapshots, {repo_id: 'nas'}, 'listSnapshots'],
    [MCPToolPathAutocomplete, {path: '/'}, 'pathAutocomplete'],
    [MCPToolRemoveRepo, {repo_id: 'nas'}, 'removeRepo'],
    [MCPToolRestoreSnapshot, {repo_id: 'nas', snapshot_id: 'abc'}, 'restore'],
    [MCPToolRunCommand, {command: 'snapshots', repo_id: 'nas'}, 'runCommand'],
    [MCPToolRunRepoTask, {repo_id: 'nas', task: 'check'}, 'doRepoTask'],
    [MCPToolSetConfig, {config: {modno: 1}}, 'setConfig'],
    [MCPToolSetRemoteClientConfig, {peer_keyid: 'k'}, 'setRemoteClientConfig'],
    [MCPToolSetupSFTP, {host: 'nas', username: 'backup'}, 'setupSFTP'],
    [MCPToolStartBackup, {plan_id: 'daily'}, 'backup'],
    [MCPToolWatchOperationEvents, {duration_seconds: 1}, 'getOperationEvents'],
];

describe('all MCP tools', () => {
    it('have unique names and register on a server', () => {
        const server = new McpServer({name: 'test', version: '1'});
        const names  = TOOLS.map(([Tool]) => new Tool(client).name);

        expect(new Set(names).size).toBe(26);
        for (const [Tool] of TOOLS) {
            new Tool(client).register(server);
        }
    });

    it.each(TOOLS)('%o calls the client with valid arguments', async (Tool, args, method) => {
        const tool   = new Tool(client);
        const parsed = z.object(tool.inputSchema).parse(args);

        calls.length = 0;
        const result = await tool.call(parsed);

        expect(result.isError).toBeUndefined();
        expect(calls).toContain(method);
    });
});
