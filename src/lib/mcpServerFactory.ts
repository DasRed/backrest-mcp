import config from '@/config';
import backrestAPIClient from '@/lib/backrestAPIClient';
import MCPServerFactory from '@/service/mcp/MCPServerFactory';
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
import {createRequire} from 'node:module';

// package.json lies two levels above src/lib and dist/lib
const {version} = createRequire(import.meta.url)('../../package.json') as {version: string};

const INSTRUCTIONS = 'Backrest is a web UI and scheduler for restic backups. Repositories hold the restic data, plans define what is backed up to which repository and when. '
    + 'Start with get_summary_dashboard or get_config to learn the IDs of repositories and plans. Times are unix milliseconds, int64 values are strings. '
    + 'Backups, forget, prune and restores run as operations in Backrest; follow them with get_operations, watch_operation_events and get_logs.';

const mcpServerFactory = new MCPServerFactory({
    instructions: INSTRUCTIONS,
    readOnly:     config.mcp.readOnly,
    tools:        [
        new MCPToolGetSummaryDashboard(backrestAPIClient),
        new MCPToolGetConfig(backrestAPIClient),
        new MCPToolGetOperations(backrestAPIClient),
        new MCPToolWatchOperationEvents(backrestAPIClient),
        new MCPToolGetLogs(backrestAPIClient),
        new MCPToolListSnapshots(backrestAPIClient),
        new MCPToolListSnapshotFiles(backrestAPIClient),
        new MCPToolGetDownloadURL(backrestAPIClient),
        new MCPToolCheckRepoExists(backrestAPIClient),
        new MCPToolPathAutocomplete(backrestAPIClient),
        new MCPToolGetPeerSyncStates(backrestAPIClient),
        new MCPToolGetMetrics(backrestAPIClient),
        new MCPToolHashPassword(backrestAPIClient),
        new MCPToolStartBackup(backrestAPIClient),
        new MCPToolCancelOperation(backrestAPIClient),
        new MCPToolRunRepoTask(backrestAPIClient),
        new MCPToolForgetSnapshots(backrestAPIClient),
        new MCPToolRestoreSnapshot(backrestAPIClient),
        new MCPToolRunCommand(backrestAPIClient),
        new MCPToolClearHistory(backrestAPIClient),
        new MCPToolSetConfig(backrestAPIClient),
        new MCPToolAddRepo(backrestAPIClient),
        new MCPToolRemoveRepo(backrestAPIClient),
        new MCPToolSetupSFTP(backrestAPIClient),
        new MCPToolGeneratePairingToken(backrestAPIClient),
        new MCPToolSetRemoteClientConfig(backrestAPIClient),
    ],
    toolsAllow:   config.mcp.toolsAllow,
    toolsDeny:    config.mcp.toolsDeny,
    version:      version,
});

export default mcpServerFactory;
