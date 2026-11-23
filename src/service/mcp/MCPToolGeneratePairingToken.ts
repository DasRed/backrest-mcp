import BackrestPermissionEnum from '@/enum/BackrestPermissionEnum';
import MCPTool from '@/service/mcp/MCPTool';
import {z, type ZodType} from 'zod';

const PERMISSIONS: Record<string, BackrestPermissionEnum> = {
    read_config:          BackrestPermissionEnum.READ_CONFIG,
    read_operations:      BackrestPermissionEnum.READ_OPERATIONS,
    read_write_config:    BackrestPermissionEnum.READ_WRITE_CONFIG,
    receive_shared_repos: BackrestPermissionEnum.RECEIVE_SHARED_REPOS,
};

export default class MCPToolGeneratePairingToken extends MCPTool {
    get description(): string {
        return 'Create a pairing token for multihost sync: another Backrest instance pastes it when adding this instance as known host and gets the given permissions. Needs an instance name and a multihost identity in the config';
    }

    get inputSchema(): Record<string, ZodType> {
        return {
            label:       z.string().min(1).describe('Readable label of the token'),
            max_uses:    z.number().int().min(0).default(1).describe('How many clients may pair with it, 0 for unlimited'),
            permissions: z.array(z.object({
                scopes: z.array(z.string()).default(['*']).describe('"*", "repo:<id>", "plan:<id>", "-repo:<id>" or "-plan:<id>"'),
                type:   z.enum(Object.keys(PERMISSIONS) as [string, ...string[]]),
            })).default([]).describe('Permissions granted to clients that pair with the token'),
            ttl_seconds: z.number().int().min(0).default(3600).describe('Lifetime in seconds, 0 for no expiry'),
        };
    }

    get name(): string {
        return 'generate_pairing_token';
    }

    get readOnly(): boolean {
        return false;
    }

    get title(): string {
        return 'Generate pairing token';
    }

    protected async execute(args: Record<string, unknown>): Promise<{token: string}> {
        const permissions = args.permissions as {scopes: string[]; type: string}[];

        return {
            token: await this.client.generatePairingToken({
                label:       args.label as string,
                maxUses:     args.max_uses as number,
                permissions: permissions.map((permission) => ({scopes: permission.scopes, type: PERMISSIONS[permission.type] as string})),
                ttlSeconds:  args.ttl_seconds as number,
            }),
        };
    }
}
