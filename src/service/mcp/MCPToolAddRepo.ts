import type BackrestAPIConfigInterface from '@/model/api/BackrestAPIConfigInterface';
import type BackrestAPIRepoInterface from '@/model/api/BackrestAPIRepoInterface';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolAddRepo extends MCPTool {
    get description(): string {
        return 'Add a repository to Backrest or update an existing one with the same ID. Backrest initializes the restic repository if it does not exist yet and indexes its snapshots. Returns the new config';
    }

    get destructive(): boolean {
        return true;
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            repo: z.object({
                autoInitialize: z.boolean().optional().describe('Initialize the repository automatically if it is missing'),
                autoUnlock:     z.boolean().optional().describe('Remove stale locks automatically'),
                env:            z.array(z.string()).optional().describe('Extra environment variables for restic as KEY=VALUE'),
                flags:          z.array(z.string()).optional().describe('Extra restic flags'),
                id:             z.string().min(1).describe('Unique, human readable ID'),
                password:       z.string().describe('Repository password, ******** keeps the stored one of an existing repository'),
                uri:            z.string().min(1).describe('restic repository URI'),
            }).loose().describe('Repository definition; further fields like prunePolicy, checkPolicy, forgetPolicy, hooks, commandPrefix as in get_config'),
        };
    }

    get name(): string {
        return 'add_repo';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Add or update repository';
    }

    protected async execute(args: Record<string, unknown>): Promise<BackrestAPIConfigInterface> {
        return this.client.addRepo(args.repo as BackrestAPIRepoInterface);
    }
}
