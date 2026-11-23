import type BackrestAPIClient from '@/service/BackrestAPIClient';
import BackrestExceptionConverter from '@/service/exception/BackrestExceptionConverter';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import type {ZodType} from 'zod';

export default abstract class MCPTool {
    protected readonly client: BackrestAPIClient;

    abstract get description(): string;

    /** destructive tools overwrite or delete existing data in Backrest or the repository */
    get destructive(): boolean {
        return false;
    }

    abstract get inputSchema(): Record<string, ZodType>;

    abstract get name(): string;

    /** read-only tools never change anything in Backrest */
    abstract get readOnly(): boolean;

    abstract get title(): string;

    constructor(client: BackrestAPIClient) {
        this.client = client;
    }

    async call(args: Record<string, unknown>): Promise<CallToolResult> {
        try {
            const result = await this.execute(args);
            const text   = typeof result === 'string' ? result : JSON.stringify(result ?? {success: true}, null, 2);

            return {content: [{text, type: 'text'}]};
        }
        catch (error) {
            return {content: [{text: `Error: ${BackrestExceptionConverter.convert(error).message}`, type: 'text'}], isError: true};
        }
    }

    protected abstract execute(args: Record<string, unknown>): Promise<unknown>;

    register(server: McpServer): this {
        server.registerTool(
            this.name,
            {
                annotations: {
                    destructiveHint: this.destructive,
                    idempotentHint:  this.readOnly,
                    openWorldHint:   false,
                    readOnlyHint:    this.readOnly,
                    title:           this.title,
                },
                description: this.description,
                inputSchema: this.inputSchema,
                title:       this.title,
            },
            (args: Record<string, unknown>) => this.call(args),
        );

        return this;
    }
}
