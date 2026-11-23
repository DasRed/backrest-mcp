import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolListSnapshots extends MCPTool {
    get description(): string {
        return 'List the restic snapshots of a repository, optionally only those of one plan, with time, host, paths, tags and summary (files and bytes added)';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            plan_id: z.string().optional().describe('Only snapshots created by this plan'),
            repo_id: z.string().min(1).describe('ID of the repository, see get_config'),
        };
    }

    get name(): string {
        return 'list_snapshots';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'List snapshots';
    }

    protected async execute(args: Record<string, unknown>): Promise<Record<string, unknown>[]> {
        return this.client.listSnapshots(args.repo_id as string, (args.plan_id as string | undefined) ?? '');
    }
}
