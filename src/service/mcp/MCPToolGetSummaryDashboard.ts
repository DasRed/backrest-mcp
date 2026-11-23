import MCPTool from '@/service/mcp/MCPTool';
import type {ZodType} from 'zod';

export default class MCPToolGetSummaryDashboard extends MCPTool {
    get description(): string {
        return 'Get the Backrest dashboard: per repository and plan the successful, failed and warning backups of the last 30 days, bytes scanned and added, snapshot count, next backup time and a per-day history';
    }

    get inputSchema(): Record<string, ZodType> {
        return {};
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

    protected async execute(): Promise<Record<string, unknown>> {
        return this.client.getSummaryDashboard();
    }
}
