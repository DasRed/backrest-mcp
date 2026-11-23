import type BackrestAPISetupSFTPRequestInterface from '@/model/api/BackrestAPISetupSFTPRequestInterface';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolSetupSFTP extends MCPTool {
    get description(): string {
        return 'Prepare an SFTP repository: Backrest generates an SSH key pair for the host, adds the host key to its known_hosts and returns the public key. Add that key to ~/.ssh/authorized_keys of the SFTP user, then use add_repo with an sftp: URI';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            host:     z.string().min(1).describe('Host name or IP of the SFTP server'),
            password: z.string().optional().describe('Password of the SFTP user; part of the API, but Backrest 1.14 does not use it yet'),
            port:     z.string().regex(/^\d+$/).default('22').describe('SSH port'),
            username: z.string().min(1).describe('SFTP user'),
        };
    }

    get name(): string {
        return 'setup_sftp';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Set up SFTP';
    }

    protected async execute(args: Record<string, unknown>): Promise<Record<string, unknown>> {
        return this.client.setupSFTP(args as unknown as BackrestAPISetupSFTPRequestInterface);
    }
}
