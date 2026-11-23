import createFakeBackrestAPIClient from '../../FakeBackrestAPIClient';
import MCPToolClearHistory from '@/service/mcp/MCPToolClearHistory';
import MCPToolGeneratePairingToken from '@/service/mcp/MCPToolGeneratePairingToken';
import MCPToolGetDownloadURL from '@/service/mcp/MCPToolGetDownloadURL';
import MCPToolGetLogs from '@/service/mcp/MCPToolGetLogs';
import MCPToolGetMetrics from '@/service/mcp/MCPToolGetMetrics';
import MCPToolGetOperations from '@/service/mcp/MCPToolGetOperations';
import MCPToolGetSummaryDashboard from '@/service/mcp/MCPToolGetSummaryDashboard';
import MCPToolRunCommand from '@/service/mcp/MCPToolRunCommand';
import MCPToolRunRepoTask from '@/service/mcp/MCPToolRunRepoTask';
import MCPToolStartBackup from '@/service/mcp/MCPToolStartBackup';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {describe, expect, it, vi} from 'vitest';

function text(result: CallToolResult): string {
    return (result.content[0] as {text: string}).text;
}

describe('MCP tools', () => {
    it('get_operations resolves a repository ID to its GUID', async () => {
        const client = createFakeBackrestAPIClient();

        await new MCPToolGetOperations(client).call({last_n: 10, repo_id: 'nas'});

        expect(client.getOperations).toHaveBeenCalledWith({repoGuid: 'guid-nas'}, 10);
    });

    it('get_operations uses only the IDs when IDs are given', async () => {
        const client = createFakeBackrestAPIClient();

        await new MCPToolGetOperations(client).call({last_n: 0, operation_ids: ['1', '2'], plan_id: 'daily'});

        expect(client.getOperations).toHaveBeenCalledWith({ids: ['1', '2']}, 0);
    });

    it('reports errors as tool errors', async () => {
        const result = await new MCPToolGetOperations(createFakeBackrestAPIClient()).call({last_n: 10, repo_id: 'missing'});

        expect(result.isError).toBe(true);
        expect(text(result)).toBe('Error: Repository "missing" not found');
    });

    it('clear_history refuses to clear everything without all=true', async () => {
        const client = createFakeBackrestAPIClient({clearHistory: vi.fn().mockResolvedValue(undefined)});
        const tool   = new MCPToolClearHistory(client);

        expect((await tool.call({all: false, only_failed: false})).isError).toBe(true);
        expect(client.clearHistory).not.toHaveBeenCalled();

        await tool.call({all: true, only_failed: true});
        expect(client.clearHistory).toHaveBeenCalledWith({}, true);
    });

    it('get_logs finds the log reference of an operation and cuts long logs', async () => {
        const client = createFakeBackrestAPIClient({
            getLogs:      vi.fn().mockResolvedValue('0123456789'),
            getOperation: vi.fn().mockResolvedValue({id: '5', operationPrune: {outputLogref: 'prune-log'}}),
        });

        const result = JSON.parse(text(await new MCPToolGetLogs(client).call({max_bytes: 4, operation_id: '5'})));

        expect(client.getLogs).toHaveBeenCalledWith('prune-log');
        expect(result).toEqual({log: '6789', ref: 'prune-log', truncated: true});
    });

    it('run_command returns the output of the command', async () => {
        const client = createFakeBackrestAPIClient({
            getOperation: vi.fn().mockResolvedValue({id: '11', operationRunCommand: {outputLogref: 'cmd-log'}, status: 'STATUS_SUCCESS'}),
            runCommand:   vi.fn().mockResolvedValue('11'),
        });

        const result = JSON.parse(text(await new MCPToolRunCommand(client).call({command: 'snapshots', include_output: true, max_bytes: 1000, repo_id: 'nas'})));

        expect(result).toEqual({operationId: '11', output: 'log output', status: 'STATUS_SUCCESS', truncated: false});
    });

    it('start_backup reports a backup that is still running', async () => {
        const client = createFakeBackrestAPIClient({backup: vi.fn().mockResolvedValue(false)});

        const result = JSON.parse(text(await new MCPToolStartBackup(client).call({dry_run: false, plan_id: 'daily', wait_seconds: 3})));

        expect(client.backup).toHaveBeenCalledWith('daily', false, 3000);
        expect(result.status).toBe('running');
    });

    it('run_repo_task maps the task names', async () => {
        const client = createFakeBackrestAPIClient({doRepoTask: vi.fn().mockResolvedValue({operationId: '1'})});

        await new MCPToolRunRepoTask(client).call({repo_id: 'nas', task: 'index_snapshots'});

        expect(client.doRepoTask).toHaveBeenCalledWith('nas', 'TASK_INDEX_SNAPSHOTS');
    });

    it('get_download_url finds the index operation of a snapshot', async () => {
        const client = createFakeBackrestAPIClient({
            getDownloadURL: vi.fn().mockResolvedValue('https://backrest/download/t/'),
            getOperations:  vi.fn().mockResolvedValue([{id: '3', operationForget: {}}, {id: '4', operationIndexSnapshot: {}}]),
        });

        const result = JSON.parse(text(await new MCPToolGetDownloadURL(client).call({file_path: '/etc', snapshot_id: 'abc'})));

        expect(client.getDownloadURL).toHaveBeenCalledWith('4', '/etc');
        expect(result).toEqual({url: 'https://backrest/download/t/'});
    });

    it('generate_pairing_token maps the permissions', async () => {
        const client = createFakeBackrestAPIClient({generatePairingToken: vi.fn().mockResolvedValue('t')});

        await new MCPToolGeneratePairingToken(client).call({label: 'eros', max_uses: 1, permissions: [{scopes: ['*'], type: 'read_operations'}], ttl_seconds: 60});

        expect(client.generatePairingToken).toHaveBeenCalledWith({label: 'eros', maxUses: 1, permissions: [{scopes: ['*'], type: 'PERMISSION_READ_OPERATIONS'}], ttlSeconds: 60});
    });

    it('get_summary_dashboard returns the compact form unless the history is requested', async () => {
        const dashboard = {planSummaries: [{historyLast30days: [{overdue: false}], id: 'daily', recentBackups: {status: ['STATUS_SUCCESS'], timestampMs: ['5']}}, {id: 'weekly'}], repoSummaries: [{id: 'nas'}]};
        const client    = createFakeBackrestAPIClient({getSummaryDashboard: vi.fn().mockResolvedValue(dashboard)});
        const tool      = new MCPToolGetSummaryDashboard(client);

        const compact = JSON.parse(text(await tool.call({include_history: false, plan_id: 'daily'})));
        expect(compact.plans.map((plan: {id: string}) => plan.id)).toEqual(['daily']);
        expect(compact.plans[0].lastBackup.timestampMs).toBe(5);
        expect(compact.repos).toEqual([]);

        const raw = JSON.parse(text(await tool.call({include_history: true, repo_id: 'nas'})));
        expect(raw).toEqual({planSummaries: [], repoSummaries: [{id: 'nas'}]});
    });

    it('get_metrics filters the lines', async () => {
        const client = createFakeBackrestAPIClient({getMetrics: vi.fn().mockResolvedValue('a_total 1\nbackrest_backup 2\n')});

        expect(text(await new MCPToolGetMetrics(client).call({filter: 'backrest'}))).toBe('backrest_backup 2');
    });
});
