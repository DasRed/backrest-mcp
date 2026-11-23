import env from '@/env';
import type ConfigInterface from '@/interface/ConfigInterface';
import ListParser from '@/service/ListParser';

const config: ConfigInterface = {
    backrest: {
        password:  env('BACKREST_MCP_BACKREST_PASSWORD', ''),
        publicURL: env('BACKREST_MCP_BACKREST_PUBLIC_URL', ''),
        timeout:   env('BACKREST_MCP_BACKREST_TIMEOUT', 60000),
        url:       env<string>('BACKREST_MCP_BACKREST_URL'),
        username:  env('BACKREST_MCP_BACKREST_USERNAME', ''),
    },
    mcp:      {
        authToken:   env('BACKREST_MCP_AUTH_TOKEN', ''),
        maskSecrets: env('BACKREST_MCP_MASK_SECRETS', true),
        path:        env('BACKREST_MCP_PATH', '/mcp'),
        readOnly:    env('BACKREST_MCP_READ_ONLY', true),
        toolsAllow:  ListParser.parse(env('BACKREST_MCP_TOOLS_ALLOW', '')),
        toolsDeny:   ListParser.parse(env('BACKREST_MCP_TOOLS_DENY', '')),
    },
    server:   {
        host:     env('BACKREST_MCP_SERVER_HOST', '0.0.0.0'),
        logLevel: env('BACKREST_MCP_SERVER_LOG_LEVEL', 'info'),
        port:     env('BACKREST_MCP_SERVER_PORT', 3000),
    },
};

// Backrest runs either without authentication or with HTTP basic auth, half a login is a mistake
if ((config.backrest.username === '') !== (config.backrest.password === '')) {
    console.error('Environment variables BACKREST_MCP_BACKREST_USERNAME and BACKREST_MCP_BACKREST_PASSWORD must be set together or both left empty.');
    process.exit(1);
}

export default config;
