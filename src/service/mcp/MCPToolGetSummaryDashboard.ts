import type BackrestAPISummaryDashboardInterface from '@/model/api/BackrestAPISummaryDashboardInterface';
import type DashboardModelInterface from '@/model/DashboardModelInterface';
import DashboardSummaryCompactor from '@/service/DashboardSummaryCompactor';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolGetSummaryDashboard extends MCPTool {
    get description(): string {
        return 'Get the Backrest dashboard per plan and repository: successful, failed and warning backups of the last 30 days, bytes scanned and added, overdue flag, next backup and the last backup and last failure. With include_history the raw per-backup charts and per-day history of Backrest are returned instead; that is large, so combine it with plan_id or repo_id';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            include_history: z.boolean().default(false).describe('Return the raw dashboard of Backrest with charts and per-day history'),
            plan_id:         z.string().optional().describe('Only this plan; without repo_id no repositories are returned'),
            repo_id:         z.string().optional().describe('Only this repository; without plan_id no plans are returned'),
        };
    }

    get name(): string {
        return 'get_summary_dashboard';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'Get dashboard summary';
    }

    protected async execute(args: Record<string, unknown>): Promise<BackrestAPISummaryDashboardInterface | DashboardModelInterface> {
        const dashboard = DashboardSummaryCompactor.filter(await this.client.getSummaryDashboard(), args.plan_id as string | undefined, args.repo_id as string | undefined);

        return args.include_history === true ? dashboard : DashboardSummaryCompactor.compact(dashboard);
    }
}
