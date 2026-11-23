import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

interface MCPToolStartBackupResultInterface {
    dryRun: boolean;
    message: string;
    planId: string;
    status: 'finished' | 'running';
}

export default class MCPToolStartBackup extends MCPTool {
    get description(): string {
        return 'Start a backup of a plan now, like "Backup now" in the Backrest UI. Waits up to wait_seconds; if the backup is not done by then it keeps running in Backrest, follow it with get_operations or watch_operation_events';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            dry_run:      z.boolean().default(false).describe('Simulate the backup without creating a snapshot'),
            plan_id:      z.string().min(1).describe('ID of the plan, see get_config'),
            wait_seconds: z.number().int().min(1).max(3600).default(10).describe('How long to wait for the backup to finish'),
        };
    }

    get name(): string {
        return 'start_backup';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Start backup';
    }

    protected async execute(args: Record<string, unknown>): Promise<MCPToolStartBackupResultInterface> {
        const planId   = args.plan_id as string;
        const dryRun   = args.dry_run as boolean;
        const finished = await this.client.backup(planId, dryRun, (args.wait_seconds as number) * 1000);

        return {
            dryRun:  dryRun,
            message: finished ? 'Backup finished successfully' : `Backup is still running, check get_operations with plan_id "${planId}"`,
            planId:  planId,
            status:  finished ? 'finished' : 'running',
        };
    }
}
