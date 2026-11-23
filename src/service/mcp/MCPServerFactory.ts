import type MCPTool from '@/service/mcp/MCPTool';
import ToolFilter from '@/service/ToolFilter';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

interface MCPServerFactoryConstructorOptionInterface {
    instructions?: string;
    name?: string;
    readOnly: boolean;
    tools: MCPTool[];
    toolsAllow?: string[];
    toolsDeny?: string[];
    version: string;
}

export default class MCPServerFactory {
    protected readonly instructions: string;
    protected readonly name: string;
    protected readonly readOnly: boolean;
    protected readonly tools: MCPTool[];
    protected readonly toolsAllow: string[];
    protected readonly toolsDeny: string[];
    protected readonly version: string;

    constructor({instructions = '', name = 'backrest-mcp', readOnly, tools, toolsAllow = [], toolsDeny = [], version}: MCPServerFactoryConstructorOptionInterface) {
        this.instructions = instructions;
        this.name         = name;
        this.readOnly     = readOnly;
        this.tools        = tools;
        this.toolsAllow   = toolsAllow;
        this.toolsDeny    = toolsDeny;
        this.version      = version;
    }

    create(): McpServer {
        const server = new McpServer({name: this.name, version: this.version}, {instructions: this.instructions === '' ? undefined : this.instructions});

        for (const tool of this.getTools()) {
            tool.register(server);
        }

        return server;
    }

    getTools(): MCPTool[] {
        return this.tools.filter((tool) => ToolFilter.isEnabled(tool, {allow: this.toolsAllow, deny: this.toolsDeny, readOnly: this.readOnly}));
    }
}
