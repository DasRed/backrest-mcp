import type BackrestAPIPeerStateInterface from '@/model/api/BackrestAPIPeerStateInterface';
import MCPTool from '@/service/mcp/MCPTool';
import type {ZodType} from 'zod';

export default class MCPToolGetPeerSyncStates extends MCPTool {
    get description(): string {
        return 'Get the multihost sync state of all known hosts and authorized clients: connection state, last heartbeat, known plans and repositories and the remote config';
    }

    get inputSchema(): Record<string, ZodType> {
        return {};
    }

    get name(): string {
        return 'get_peer_sync_states';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'Get peer sync states';
    }

    protected async execute(): Promise<BackrestAPIPeerStateInterface[]> {
        return this.client.getPeerSyncStates();
    }
}
