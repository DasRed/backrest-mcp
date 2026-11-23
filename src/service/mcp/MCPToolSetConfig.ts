import type BackrestAPIConfigInterface from '@/model/api/BackrestAPIConfigInterface';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolSetConfig extends MCPTool {
    get description(): string {
        return 'Replace the complete Backrest configuration (plans, repositories, users, multihost). Call get_config first, change only what is needed and pass the whole object back including "modno"; Backrest rejects the call if the config changed in between. Masked values (********) are restored from the stored config';
    }

    get destructive(): boolean {
        return true;
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            config: z.record(z.string(), z.unknown()).describe('Complete config object as returned by get_config, with your changes'),
        };
    }

    get name(): string {
        return 'set_config';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Set config';
    }

    protected async execute(args: Record<string, unknown>): Promise<BackrestAPIConfigInterface> {
        return this.client.setConfig(args.config as BackrestAPIConfigInterface);
    }
}
