import BackrestExceptionAPINotFound from '@/service/exception/BackrestExceptionAPINotFound';
import BackrestExceptionInvalidInput from '@/service/exception/BackrestExceptionInvalidInput';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolGetDownloadURL extends MCPTool {
    get description(): string {
        return 'Create a signed download link for a file or directory (as tar.gz) from a snapshot or from the result of a restore operation. The link works without login, hand it only to the user';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            file_path:    z.string().default('').describe('Path inside the snapshot or restore, empty for everything'),
            operation_id: z.string().regex(/^\d+$/).optional().describe('ID of a restore operation or of the index operation of a snapshot'),
            snapshot_id:  z.string().optional().describe('restic snapshot ID, used to find the index operation instead of operation_id'),
        };
    }

    get name(): string {
        return 'get_download_url';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'Get download link';
    }

    protected async execute(args: Record<string, unknown>): Promise<{url: string}> {
        const operationId = await this.resolveOperationId(args.operation_id as string | undefined, args.snapshot_id as string | undefined);

        return {url: await this.client.getDownloadURL(operationId, args.file_path as string)};
    }

    protected async resolveOperationId(operationId: string | undefined, snapshotId: string | undefined): Promise<string> {
        if (operationId !== undefined) {
            return operationId;
        }
        if (snapshotId === undefined || snapshotId === '') {
            throw new BackrestExceptionInvalidInput('Pass either operation_id or snapshot_id');
        }

        const operations = await this.client.getOperations({snapshotId});
        const index      = operations.find((operation) => operation.operationIndexSnapshot != null);
        if (index === undefined) {
            throw new BackrestExceptionAPINotFound(`Snapshot ${snapshotId} is not indexed in Backrest`, 404, 'not_found', null);
        }

        return index.id;
    }
}
