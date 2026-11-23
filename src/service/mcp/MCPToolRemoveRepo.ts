import type BackrestAPIConfigInterface from '@/model/api/BackrestAPIConfigInterface';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolRemoveRepo extends MCPTool {
    get description(): string {
        return 'Remove a repository from the Backrest config and delete its operation history in Backrest. The restic repository and its data on disk are not deleted. Returns the new config';
    }

    get destructive(): boolean {
        return true;
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            repo_id: z.string().min(1).describe('ID of the repository, see get_config'),
        };
    }

    get name(): string {
        return 'remove_repo';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Remove repository';
    }

    protected async execute(args: Record<string, unknown>): Promise<BackrestAPIConfigInterface> {
        return this.client.removeRepo(args.repo_id as string);
    }
}
