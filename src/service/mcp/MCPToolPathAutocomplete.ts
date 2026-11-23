import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolPathAutocomplete extends MCPTool {
    get description(): string {
        return 'List the entries of a directory on the Backrest host (or in its container), e.g. to find the paths for a backup plan or a restore target';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            path: z.string().min(1).describe('Absolute directory path, e.g. /mnt'),
        };
    }

    get name(): string {
        return 'path_autocomplete';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'List server directory';
    }

    protected async execute(args: Record<string, unknown>): Promise<string[]> {
        return this.client.pathAutocomplete(args.path as string);
    }
}
