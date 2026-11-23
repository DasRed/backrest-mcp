import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolCancelOperation extends MCPTool {
    get description(): string {
        return 'Cancel a pending or running operation, e.g. a backup or prune. Not guaranteed to succeed';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            operation_id: z.string().regex(/^\d+$/).describe('ID of the operation, see get_operations'),
        };
    }

    get name(): string {
        return 'cancel_operation';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Cancel operation';
    }

    protected async execute(args: Record<string, unknown>): Promise<{operationId: string; success: boolean}> {
        await this.client.cancel(args.operation_id as string);

        return {operationId: args.operation_id as string, success: true};
    }
}
