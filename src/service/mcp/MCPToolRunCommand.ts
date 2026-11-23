import MCPTool from '@/service/mcp/MCPTool';
import OperationLogReference from '@/service/OperationLogReference';
import TextTail from '@/service/TextTail';
import {z, type ZodType} from 'zod';

interface MCPToolRunCommandResultInterface {
    operationId: string;
    output?: string;
    status?: string;
    truncated?: boolean;
}

export default class MCPToolRunCommand extends MCPTool {
    get description(): string {
        return 'Run any restic command against a repository, like the command console in the Backrest UI, e.g. "snapshots --compact", "stats --mode raw-data" or "check". Backrest adds repository, password and flags. Returns the operation ID and, unless disabled, the output';
    }

    get destructive(): boolean {
        return true;
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            command:        z.string().min(1).describe('restic arguments without "restic", e.g. "snapshots --json"'),
            include_output: z.boolean().default(true).describe('Return the output of the command'),
            max_bytes:      z.number().int().min(1000).max(1000000).default(100000).describe('Maximum size of the returned output'),
            repo_id:        z.string().min(1).describe('ID of the repository'),
        };
    }

    get name(): string {
        return 'run_command';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Run restic command';
    }

    protected async execute(args: Record<string, unknown>): Promise<MCPToolRunCommandResultInterface> {
        const operationId = await this.client.runCommand(args.repo_id as string, args.command as string);
        if (args.include_output === false || operationId === '') {
            return {operationId};
        }

        const operation = await this.client.getOperation(operationId);
        const ref       = operation === null ? '' : OperationLogReference.get(operation);
        if (ref === '') {
            return {operationId, status: operation?.status};
        }

        const output = TextTail.cut(await this.client.getLogs(ref), args.max_bytes as number);

        return {operationId, output: output.text, status: operation?.status, truncated: output.truncated};
    }
}
