import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolGetMetrics extends MCPTool {
    get description(): string {
        return 'Get the Prometheus metrics of Backrest (backup durations, bytes added, task counts per plan). Optionally only lines containing a filter text';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            filter: z.string().optional().describe('Only metric lines containing this text, e.g. backrest_backup'),
        };
    }

    get name(): string {
        return 'get_metrics';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'Get metrics';
    }

    protected async execute(args: Record<string, unknown>): Promise<string> {
        const metrics = await this.client.getMetrics();
        const filter  = args.filter as string | undefined;
        if (filter === undefined || filter === '') {
            return metrics;
        }

        return metrics.split('\n')
                      .filter((line) => line.includes(filter))
                      .join('\n');
    }
}
