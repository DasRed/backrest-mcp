import type BackrestAPIConfigInterface from '@/model/api/BackrestAPIConfigInterface';
import MCPTool from '@/service/mcp/MCPTool';
import type {ZodType} from 'zod';

export default class MCPToolGetConfig extends MCPTool {
    get description(): string {
        return 'Get the Backrest configuration: instance name, repositories, backup plans with schedules, retention and hooks, users and multihost settings. Secrets are replaced with ******** unless masking is disabled; keep them as they are when passing the config back to set_config';
    }

    get inputSchema(): Record<string, ZodType> {
        return {};
    }

    get name(): string {
        return 'get_config';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'Get config';
    }

    protected async execute(): Promise<BackrestAPIConfigInterface> {
        return this.client.getConfig();
    }
}
