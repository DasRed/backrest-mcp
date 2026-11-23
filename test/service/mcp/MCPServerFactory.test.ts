import createFakeBackrestAPIClient from '../../FakeBackrestAPIClient';
import MCPServerFactory from '@/service/mcp/MCPServerFactory';
import MCPToolGetConfig from '@/service/mcp/MCPToolGetConfig';
import MCPToolGetOperations from '@/service/mcp/MCPToolGetOperations';
import MCPToolRemoveRepo from '@/service/mcp/MCPToolRemoveRepo';
import MCPToolStartBackup from '@/service/mcp/MCPToolStartBackup';
import {describe, expect, it} from 'vitest';

const client = createFakeBackrestAPIClient();
const tools  = [new MCPToolGetConfig(client), new MCPToolGetOperations(client), new MCPToolStartBackup(client), new MCPToolRemoveRepo(client)];

describe('MCPServerFactory', () => {
    it('hides write tools in read-only mode', () => {
        const factory = new MCPServerFactory({readOnly: true, tools, version: '1.0.0'});

        expect(factory.getTools().map((tool) => tool.name)).toEqual(['get_config', 'get_operations']);
    });

    it('applies the allow and deny lists', () => {
        const factory = new MCPServerFactory({readOnly: false, tools, toolsAllow: ['get_*', 'start_*', 'remove_*'], toolsDeny: ['remove_*'], version: '1.0.0'});

        expect(factory.getTools().map((tool) => tool.name)).toEqual(['get_config', 'get_operations', 'start_backup']);
        expect(factory.create()).toBeDefined();
    });

    it('marks read, write and destructive tools', () => {
        expect(tools.map((tool) => [tool.name, tool.readOnly, tool.destructive])).toEqual([
            ['get_config', true, false],
            ['get_operations', true, false],
            ['start_backup', false, false],
            ['remove_repo', false, true],
        ]);
    });
});
