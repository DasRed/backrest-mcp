import type BackrestAPIScheduleTaskResponseInterface from '@/model/api/BackrestAPIScheduleTaskResponseInterface';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolForgetSnapshots extends MCPTool {
    get description(): string {
        return 'Forget snapshots: with snapshot_id exactly this snapshot is removed, without it the retention policy of the plan is applied. The data is freed by the next prune. Returns the ID of the scheduled operation';
    }

    get destructive(): boolean {
        return true;
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            plan_id:     z.string().min(1).describe('ID of the plan the snapshots belong to'),
            repo_id:     z.string().min(1).describe('ID of the repository'),
            snapshot_id: z.string().optional().describe('Forget only this snapshot'),
        };
    }

    get name(): string {
        return 'forget_snapshots';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Forget snapshots';
    }

    protected async execute(args: Record<string, unknown>): Promise<BackrestAPIScheduleTaskResponseInterface> {
        return this.client.forget(args.repo_id as string, args.plan_id as string, (args.snapshot_id as string | undefined) ?? '');
    }
}
