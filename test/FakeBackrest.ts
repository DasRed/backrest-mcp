import {createServer, type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import type {AddressInfo} from 'node:net';

type FakeBackrestHandlerType = (request: FakeBackrestRequestInterface, response: ServerResponse) => void | Promise<void>;

export interface FakeBackrestRequestInterface {
    body: Buffer;
    headers: IncomingMessage['headers'];
    method: string;
    path: string;
}

// A small HTTP server that plays Backrest for the client tests, so the Connect wire format is tested for real.
export default class FakeBackrest {
    protected handlers: Map<string, FakeBackrestHandlerType> = new Map();
    readonly requests: FakeBackrestRequestInterface[]        = [];
    protected server: Server;

    get url(): string {
        return `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`;
    }

    constructor() {
        this.server = createServer((request, response) => {
            const chunks: Buffer[] = [];
            request.on('data', (chunk: Buffer) => chunks.push(chunk));
            request.on('end', () => {
                const entry = {body: Buffer.concat(chunks), headers: request.headers, method: request.method ?? '', path: request.url ?? ''};
                this.requests.push(entry);

                const handler = this.handlers.get(entry.path);
                if (handler === undefined) {
                    response.writeHead(404, {'content-type': 'application/json'}).end(JSON.stringify({code: 'unimplemented', message: 'no handler'}));
                    return;
                }

                void handler(entry, response);
            });
        });
    }

    static frame(message: unknown, endStream: boolean = false): Buffer {
        const payload = Buffer.from(JSON.stringify(message), 'utf8');
        const header  = Buffer.alloc(5);
        header.writeUInt8(endStream ? 2 : 0, 0);
        header.writeUInt32BE(payload.length, 1);

        return Buffer.concat([header, payload]);
    }

    async close(): Promise<void> {
        this.server.closeAllConnections();
        await new Promise<void>((resolve) => this.server.close(() => resolve()));
    }

    json(path: string, data: unknown, status: number = 200): this {
        return this.on(path, (_request, response) => {
            response.writeHead(status, {'content-type': 'application/json'}).end(JSON.stringify(data));
        });
    }

    lastBody(): Record<string, unknown> {
        return JSON.parse(this.requests.at(-1)?.body.toString('utf8') ?? '{}') as Record<string, unknown>;
    }

    on(path: string, handler: FakeBackrestHandlerType): this {
        this.handlers.set(path, handler);

        return this;
    }

    async start(): Promise<this> {
        await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', () => resolve()));

        return this;
    }
}
