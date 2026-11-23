import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolHashPassword extends MCPTool {
    get description(): string {
        return 'Let Backrest create the bcrypt hash of a password, e.g. for a new user in auth.users of set_config (field passwordBcrypt). Changes nothing';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            password: z.string().min(1).describe('Password to hash'),
        };
    }

    get name(): string {
        return 'hash_password';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'Hash password';
    }

    protected async execute(args: Record<string, unknown>): Promise<{passwordBcrypt: string}> {
        return {passwordBcrypt: await this.client.hashPassword(args.password as string)};
    }
}
