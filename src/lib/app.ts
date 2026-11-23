import config from '@/config';
import fastify from 'fastify';

const app = fastify({bodyLimit: 4 * 1024 * 1024, logger: {level: config.server.logLevel}});

export default app;
