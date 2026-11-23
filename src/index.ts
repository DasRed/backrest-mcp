import config from '@/config';
import app from '@/lib/app';
import backrestAPIClient from '@/lib/backrestAPIClient';
import mcpServerFactory from '@/lib/mcpServerFactory';
import route from '@/route/index';

await app.register(route);
await app.listen({host: config.server.host, port: config.server.port});

app.log.info({
    authentication: backrestAPIClient.authenticated ? 'basic' : 'none',
    backrest:       config.backrest.url,
    readOnly:       config.mcp.readOnly,
    tools:          mcpServerFactory.getTools().map((tool) => tool.name),
}, 'backrest-mcp ready');

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
        void app.close().then(() => process.exit(0));
    });
}
