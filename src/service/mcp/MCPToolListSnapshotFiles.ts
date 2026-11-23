import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolListSnapshotFiles extends MCPTool {
    get description(): string {
        return 'List the files and directories of one directory inside a snapshot (name, type, size, mode, modification time), to browse a backup before restoring';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            path:        z.string().default('/').describe('Directory inside the snapshot'),
            repo_id:     z.string().min(1).describe('ID of the repository'),
            snapshot_id: z.string().min(1).describe('restic snapshot ID, see list_snapshots'),
        };
    }

    get name(): string {
        return 'list_snapshot_files';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'List snapshot files';
    }

    protected async execute(args: Record<string, unknown>): Promise<Record<string, unknown>> {
        return this.client.listSnapshotFiles(args.repo_id as string, args.snapshot_id as string, args.path as string);
    }
}
