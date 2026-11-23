import type BackrestAPIRepoInterface from '@/model/api/BackrestAPIRepoInterface';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

export default class MCPToolCheckRepoExists extends MCPTool {
    get description(): string {
        return 'Check whether a restic repository already exists at the given URI with the given password, before adding it with add_repo. Returns exists, error and hostKeyUntrusted (SFTP host key unknown, see setup_sftp)';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            repo: z.object({
                env:      z.array(z.string()).optional().describe('Extra environment variables for restic as KEY=VALUE, e.g. AWS_ACCESS_KEY_ID=...'),
                flags:    z.array(z.string()).optional().describe('Extra restic flags'),
                id:       z.string().min(1).describe('ID of the repository in Backrest'),
                password: z.string().describe('Repository password, ******** uses the stored one of an existing repository'),
                uri:      z.string().min(1).describe('restic repository URI, e.g. /backups/repo, sftp:user@host:/path, s3:..., rest:...'),
            }).loose().describe('Repository definition as in get_config'),
        };
    }

    get name(): string {
        return 'check_repo_exists';
    }

    get readOnly(): boolean {
        return true;
    }

    get title(): string {
        return 'Check repository';
    }

    protected async execute(args: Record<string, unknown>): Promise<Record<string, unknown>> {
        return this.client.checkRepoExists(args.repo as BackrestAPIRepoInterface);
    }
}
