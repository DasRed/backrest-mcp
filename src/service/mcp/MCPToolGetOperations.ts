import type BackrestAPIOperationInterface from '@/model/api/BackrestAPIOperationInterface';
import MCPTool from '@/service/mcp/MCPTool';
import OperationSelectorBuilder from '@/service/OperationSelectorBuilder';
import {z, type ZodType} from 'zod';

export default class MCPToolGetOperations extends MCPTool {
    get description(): string {
        return 'Get the operation history of Backrest (backups, snapshot indexing, forget, prune, check, restore, stats, hooks, commands) with status, timestamps in unix milliseconds, errors and progress. Without filters the latest operations of all plans are returned';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            flow_id:       z.string().regex(/^\d+$/).optional().describe('Flow ID; groups the operations of one plan run'),
            instance_id:   z.string().optional().describe('Backrest instance that created the operations'),
            last_n:        z.number().int().min(0).max(1000).default(50).describe('Only the latest n operations, 0 for all'),
            operation_ids: z.array(z.string().regex(/^\d+$/)).optional().describe('Operation IDs; cannot be combined with the other filters'),
            plan_id:       z.string().optional().describe('ID of a plan'),
            repo_id:       z.string().optional().describe('ID of a repository'),
            snapshot_id:   z.string().optional().describe('restic snapshot ID'),
        };
    }

    get name(): string {
        return 'get_operations';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'Get operations';
    }

    protected async execute(args: Record<string, unknown>): Promise<BackrestAPIOperationInterface[]> {
        const selector = await OperationSelectorBuilder.build(this.client, {
            flowId:     args.flow_id as string | undefined,
            ids:        args.operation_ids as string[] | undefined,
            instanceId: args.instance_id as string | undefined,
            planId:     args.plan_id as string | undefined,
            repoId:     args.repo_id as string | undefined,
            snapshotId: args.snapshot_id as string | undefined,
        });

        return this.client.getOperations(selector, args.last_n as number);
    }
}
