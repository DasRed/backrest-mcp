import type BackrestAPIScheduleTaskResponseInterface from '@/model/api/BackrestAPIScheduleTaskResponseInterface';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolRestoreSnapshot extends MCPTool {
    get description(): string {
        return 'Restore a snapshot or a path inside it to a new directory on the Backrest host. The target must not exist yet; without target Backrest uses ~/Downloads/restic-restore-<time>. Returns the ID of the scheduled operation, the result can be downloaded with get_download_url';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            path:        z.string().default('/').describe('File or directory inside the snapshot'),
            plan_id:     z.string().optional().describe('ID of the plan the snapshot belongs to'),
            repo_id:     z.string().min(1).describe('ID of the repository'),
            snapshot_id: z.string().min(1).describe('restic snapshot ID'),
            target:      z.string().optional().describe('New directory on the Backrest host'),
        };
    }

    get name(): string {
        return 'restore_snapshot';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Restore snapshot';
    }

    protected async execute(args: Record<string, unknown>): Promise<BackrestAPIScheduleTaskResponseInterface> {
        return this.client.restore({
            path:       args.path as string,
            planId:     (args.plan_id as string | undefined) ?? '',
            repoId:     args.repo_id as string,
            snapshotId: args.snapshot_id as string,
            target:     (args.target as string | undefined) ?? '',
        });
    }
}
