import type BackrestAPIOperationEventInterface from '@/model/api/BackrestAPIOperationEventInterface';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolWatchOperationEvents extends MCPTool {
    get description(): string {
        return 'Listen to the live operation stream of Backrest for a while and return all created, updated and deleted operations in that time, e.g. to follow the progress of a running backup';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            duration_seconds: z.number().int().min(1).max(300).default(30).describe('How long to listen'),
        };
    }

    get name(): string {
        return 'watch_operation_events';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'Watch operation events';
    }

    protected async execute(args: Record<string, unknown>): Promise<BackrestAPIOperationEventInterface[]> {
        return this.client.getOperationEvents((args.duration_seconds as number) * 1000);
    }
}
