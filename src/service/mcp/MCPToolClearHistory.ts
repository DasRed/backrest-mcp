import BackrestExceptionInvalidInput from '@/service/exception/BackrestExceptionInvalidInput';
import MCPTool from '@/service/mcp/MCPTool';
import OperationSelectorBuilder from '@/service/OperationSelectorBuilder';
import {z, type ZodType} from 'zod';

export default class MCPToolClearHistory extends MCPTool {
    get description(): string {
        return 'Delete entries from the operation history of Backrest (not the snapshots). Needs at least one filter, or all=true to clear the complete history';
    }

    get destructive(): boolean {
        return true;
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            all:           z.boolean().default(false).describe('Confirm clearing without filters'),
            only_failed:   z.boolean().default(false).describe('Only delete failed operations'),
            operation_ids: z.array(z.string().regex(/^\d+$/)).optional().describe('Operation IDs; cannot be combined with the other filters'),
            plan_id:       z.string().optional().describe('ID of a plan'),
            repo_id:       z.string().optional().describe('ID of a repository'),
        };
    }

    get name(): string {
        return 'clear_history';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Clear history';
    }

    protected async execute(args: Record<string, unknown>): Promise<{success: boolean}> {
        const selector = await OperationSelectorBuilder.build(this.client, {
            ids:    args.operation_ids as string[] | undefined,
            planId: args.plan_id as string | undefined,
            repoId: args.repo_id as string | undefined,
        });
        if (Object.keys(selector).length === 0 && args.all !== true) {
            throw new BackrestExceptionInvalidInput('No filter given; pass plan_id, repo_id or operation_ids, or all=true to clear the complete history');
        }

        await this.client.clearHistory(selector, args.only_failed as boolean);

        return {success: true};
    }
}
