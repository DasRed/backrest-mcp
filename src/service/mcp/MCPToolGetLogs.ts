import BackrestExceptionAPINotFound from '@/service/exception/BackrestExceptionAPINotFound';
import BackrestExceptionInvalidInput from '@/service/exception/BackrestExceptionInvalidInput';
import MCPTool from '@/service/mcp/MCPTool';
import OperationLogReference from '@/service/OperationLogReference';
import TextTail from '@/service/TextTail';
import {z, type ZodType} from 'zod';

interface MCPToolGetLogsResultInterface {
    log: string;
    ref: string;
    truncated: boolean;
}

export default class MCPToolGetLogs extends MCPTool {
    get description(): string {
        return 'Get the log or output of an operation (backup log, prune/check output, hook or command output). Pass operation_id, or the log reference (logref, outputLogref) of an operation from get_operations. Long logs are cut to the last max_bytes';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            max_bytes:    z.number().int().min(1000).max(1000000).default(100000).describe('Maximum size of the returned log'),
            operation_id: z.string().regex(/^\d+$/).optional().describe('ID of the operation'),
            ref:          z.string().optional().describe('Log reference of an operation'),
        };
    }

    get name(): string {
        return 'get_logs';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'Get logs';
    }

    protected async execute(args: Record<string, unknown>): Promise<MCPToolGetLogsResultInterface> {
        const ref = await this.resolveRef(args.ref as string | undefined, args.operation_id as string | undefined);
        const log = TextTail.cut(await this.client.getLogs(ref), args.max_bytes as number);

        return {log: log.text, ref, truncated: log.truncated};
    }

    protected async resolveRef(ref: string | undefined, operationId: string | undefined): Promise<string> {
        if (ref !== undefined && ref !== '') {
            return ref;
        }
        if (operationId === undefined) {
            throw new BackrestExceptionInvalidInput('Pass either ref or operation_id');
        }

        const operation = await this.client.getOperation(operationId);
        if (operation === null) {
            throw new BackrestExceptionAPINotFound(`Operation ${operationId} not found`, 404, 'not_found', null);
        }

        const found = OperationLogReference.get(operation);
        if (found === '') {
            throw new BackrestExceptionAPINotFound(`Operation ${operationId} has no log`, 404, 'not_found', null);
        }

        return found;
    }
}
