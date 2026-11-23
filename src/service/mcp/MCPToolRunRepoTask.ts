import BackrestRepoTaskEnum from '@/enum/BackrestRepoTaskEnum';
import type BackrestAPIScheduleTaskResponseInterface from '@/model/api/BackrestAPIScheduleTaskResponseInterface';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

const TASKS: Record<string, BackrestRepoTaskEnum> = {
    check:           BackrestRepoTaskEnum.CHECK,
    forget:          BackrestRepoTaskEnum.FORGET,
    index_snapshots: BackrestRepoTaskEnum.INDEX_SNAPSHOTS,
    prune:           BackrestRepoTaskEnum.PRUNE,
    stats:           BackrestRepoTaskEnum.STATS,
    unlock:          BackrestRepoTaskEnum.UNLOCK,
};

export default class MCPToolRunRepoTask extends MCPTool {
    get description(): string {
        return 'Run a maintenance task on a repository: check (verify integrity), prune (remove unreferenced data), forget (apply the forget policy of the repository), stats (compute size), index_snapshots (re-read snapshots) or unlock (remove stale locks). Returns the ID of the scheduled operation; unlock runs immediately and returns none';
    }

    get destructive(): boolean {
        return true;
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            repo_id: z.string().min(1).describe('ID of the repository'),
            task:    z.enum(Object.keys(TASKS) as [string, ...string[]]).describe('Task to run'),
        };
    }

    get name(): string {
        return 'run_repo_task';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Run repository task';
    }

    protected async execute(args: Record<string, unknown>): Promise<BackrestAPIScheduleTaskResponseInterface> {
        return this.client.doRepoTask(args.repo_id as string, TASKS[args.task as string] as BackrestRepoTaskEnum);
    }
}
