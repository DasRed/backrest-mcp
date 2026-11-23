import type BackrestAPIPlanInterface from '@/model/api/BackrestAPIPlanInterface';
import type BackrestAPIRepoInterface from '@/model/api/BackrestAPIRepoInterface';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolSetRemoteClientConfig extends MCPTool {
    get description(): string {
        return 'Push plans and repositories to a connected client instance (multihost sync) or delete them there. The client must have granted read_write_config. Masked values cannot be used here, pass real values';
    }

    get destructive(): boolean {
        return true;
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            peer_keyid:      z.string().min(1).describe('Key ID of the connected peer, see get_peer_sync_states'),
            plans:           z.array(z.record(z.string(), z.unknown())).default([]).describe('Plans to create or update on the peer'),
            plans_to_delete: z.array(z.string()).default([]).describe('Plan IDs to delete on the peer'),
            repos:           z.array(z.record(z.string(), z.unknown())).default([]).describe('Repositories to create or update on the peer'),
            repos_to_delete: z.array(z.string()).default([]).describe('Repository IDs to delete on the peer'),
        };
    }

    get name(): string {
        return 'set_remote_client_config';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Set remote client config';
    }

    protected async execute(args: Record<string, unknown>): Promise<{success: boolean}> {
        await this.client.setRemoteClientConfig({
            peerKeyid:     args.peer_keyid as string,
            plans:         args.plans as BackrestAPIPlanInterface[],
            plansToDelete: args.plans_to_delete as string[],
            repos:         args.repos as BackrestAPIRepoInterface[],
            reposToDelete: args.repos_to_delete as string[],
        });

        return {success: true};
    }
}
