import FakeBackrest from '../FakeBackrest';
import BackrestRepoTaskEnum from '@/enum/BackrestRepoTaskEnum';
import BackrestAPIClient from '@/service/BackrestAPIClient';
import BackrestSecretMasker from '@/service/BackrestSecretMasker';
import BackrestExceptionAPI from '@/service/exception/BackrestExceptionAPI';
import BackrestExceptionAPINotFound from '@/service/exception/BackrestExceptionAPINotFound';
import BackrestExceptionAPIUnauthenticated from '@/service/exception/BackrestExceptionAPIUnauthenticated';
import BackrestExceptionConfiguration from '@/service/exception/BackrestExceptionConfiguration';
import BackrestExceptionTimeout from '@/service/exception/BackrestExceptionTimeout';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';

const CONFIG = {
    instance: 'atlas',
    modno:    3,
    plans:    [{id: 'daily', repo: 'nas'}],
    repos:    [{env: ['AWS_SECRET_ACCESS_KEY=abc'], guid: 'g-1', id: 'nas', password: 'repo-secret', uri: '/backup'}],
};

describe('BackrestAPIClient', () => {
    let backrest: FakeBackrest;

    beforeEach(async () => {
        backrest = await new FakeBackrest().start();
    });

    afterEach(async () => {
        await backrest.close();
    });

    it('calls Backrest without authorization when no credentials are configured', async () => {
        backrest.json('/v1.Backrest/GetSummaryDashboard', {repoSummaries: []});
        const client = new BackrestAPIClient({url: `${backrest.url}/`});

        expect(client.authenticated).toBe(false);
        expect(await client.getSummaryDashboard()).toEqual({repoSummaries: []});

        const request = backrest.requests[0];
        expect(request?.method).toBe('POST');
        expect(request?.headers['content-type']).toBe('application/json');
        expect(request?.headers['connect-protocol-version']).toBe('1');
        expect(request?.headers.authorization).toBeUndefined();
    });

    it('sends HTTP basic auth when credentials are configured', async () => {
        backrest.json('/v1.Backrest/GetSummaryDashboard', {});
        const client = new BackrestAPIClient({password: 'p@ss:word', url: backrest.url, username: 'claude'});

        await client.getSummaryDashboard();

        expect(client.authenticated).toBe(true);
        expect(backrest.requests[0]?.headers.authorization).toBe(`Basic ${Buffer.from('claude:p@ss:word').toString('base64')}`);
    });

    it('rejects half a login', () => {
        expect(() => new BackrestAPIClient({url: backrest.url, username: 'claude'})).toThrow(BackrestExceptionConfiguration);
        expect(() => new BackrestAPIClient({password: 'x', url: backrest.url})).toThrow(BackrestExceptionConfiguration);
    });

    it('maps Connect errors and the plain text 401 of Backrest', async () => {
        backrest.json('/v1.Backrest/ListSnapshots', {code: 'not_found', message: 'repo "x" not found'}, 404);
        backrest.on('/v1.Backrest/GetSummaryDashboard', (_request, response) => {
            response.writeHead(401, {'content-type': 'text/plain'}).end('Unauthorized (No Authorization Header)\n');
        });
        backrest.json('/v1.Backrest/Cancel', {code: 'internal', message: 'boom'}, 500);
        const client = new BackrestAPIClient({url: backrest.url});

        await expect(client.listSnapshots('x')).rejects.toThrow(BackrestExceptionAPINotFound);
        await expect(client.getSummaryDashboard()).rejects.toThrow(BackrestExceptionAPIUnauthenticated);
        await expect(client.getSummaryDashboard()).rejects.toThrow('Unauthorized (No Authorization Header)');

        const error = await client.cancel('1').catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(BackrestExceptionAPI);
        expect((error as BackrestExceptionAPI).code).toBe('internal');
        expect((error as BackrestExceptionAPI).status).toBe(500);
    });

    it('masks secrets of the config and restores them on set_config', async () => {
        backrest.json('/v1.Backrest/GetConfig', CONFIG);
        backrest.on('/v1.Backrest/SetConfig', (request, response) => {
            response.writeHead(200, {'content-type': 'application/json'}).end(request.body);
        });
        const client = new BackrestAPIClient({url: backrest.url});

        const config = await client.getConfig();
        expect(config.repos?.[0]?.password).toBe('********');
        expect(config.repos?.[0]?.env).toEqual(['AWS_SECRET_ACCESS_KEY=********']);

        const updated = await client.setConfig({...config, instance: 'renamed'});
        const sent    = backrest.lastBody() as typeof CONFIG;
        expect(sent.instance).toBe('renamed');
        expect(sent.repos[0]?.password).toBe('repo-secret');
        expect(sent.repos[0]?.env).toEqual(['AWS_SECRET_ACCESS_KEY=abc']);
        expect(updated.repos?.[0]?.password).toBe('********');
    });

    it('returns secrets unmasked when masking is disabled', async () => {
        backrest.json('/v1.Backrest/GetConfig', CONFIG);
        const client = new BackrestAPIClient({masker: new BackrestSecretMasker(false), url: backrest.url});

        expect((await client.getConfig()).repos?.[0]?.password).toBe('repo-secret');
    });

    it('restores the stored password when adding an existing repository', async () => {
        backrest.json('/v1.Backrest/GetConfig', CONFIG);
        backrest.json('/v1.Backrest/AddRepo', CONFIG);
        const client = new BackrestAPIClient({url: backrest.url});

        await client.addRepo({id: 'nas', password: '********', uri: '/backup2'});

        expect(backrest.lastBody()).toEqual({repo: {id: 'nas', password: 'repo-secret', uri: '/backup2'}});
    });

    it('sends the request messages of the scheduling procedures', async () => {
        backrest.json('/v1.Backrest/DoRepoTask', {operationId: '7'});
        backrest.json('/v1.Backrest/Forget', {operationId: '8'});
        backrest.json('/v1.Backrest/Restore', {operationId: '9'});
        backrest.json('/v1.Backrest/GetOperations', {operations: [{id: '1'}]});
        const client = new BackrestAPIClient({url: backrest.url});

        expect(await client.doRepoTask('nas', BackrestRepoTaskEnum.PRUNE)).toEqual({operationId: '7'});
        expect(backrest.lastBody()).toEqual({repoId: 'nas', task: 'TASK_PRUNE'});

        await client.forget('nas', 'daily');
        expect(backrest.lastBody()).toEqual({planId: 'daily', repoId: 'nas', snapshotId: ''});

        await client.restore({path: '/etc', repoId: 'nas', snapshotId: 'abc', target: '/restore'});
        expect(backrest.lastBody()).toEqual({path: '/etc', repoId: 'nas', snapshotId: 'abc', target: '/restore'});

        expect(await client.getOperations({planId: 'daily'}, 5)).toEqual([{id: '1'}]);
        expect(backrest.lastBody()).toEqual({lastN: 5, selector: {planId: 'daily'}});
    });

    it('reports a finished and a still running backup', async () => {
        backrest.json('/v1.Backrest/Backup', {});
        const client = new BackrestAPIClient({url: backrest.url});

        expect(await client.backup('daily', true, 2000)).toBe(true);
        expect(backrest.lastBody()).toEqual({dryRun: true, value: 'daily'});

        backrest.on('/v1.Backrest/Backup', () => {
            // never answers, like a long running backup
        });
        expect(await client.backup('daily', false, 200)).toBe(false);
    });

    it('names the address when Backrest is not reachable', async () => {
        const url = backrest.url;
        await backrest.close();
        backrest = await new FakeBackrest().start();

        await expect(new BackrestAPIClient({url}).getConfig()).rejects.toThrow(`Backrest is not reachable at ${url}: `);
    });

    it('throws a timeout when Backrest does not answer', async () => {
        backrest.on('/v1.Backrest/GetConfig', () => {
            // never answers
        });
        const client = new BackrestAPIClient({timeout: 200, url: backrest.url});

        await expect(client.getConfig()).rejects.toThrow(BackrestExceptionTimeout);
    });

    it('reads server streams until the end of the stream', async () => {
        backrest.on('/v1.Backrest/GetLogs', (request, response) => {
            response.writeHead(200, {'content-type': 'application/connect+json'});
            response.write(FakeBackrest.frame({value: Buffer.from('line 1\n').toString('base64')}));
            response.write(FakeBackrest.frame({value: Buffer.from('line 2\n').toString('base64')}).subarray(0, 4));
            response.end(Buffer.concat([FakeBackrest.frame({value: Buffer.from('line 2\n').toString('base64')}).subarray(4), FakeBackrest.frame({}, true)]));
        });
        const client = new BackrestAPIClient({url: backrest.url});

        expect(await client.getLogs('log-1')).toBe('line 1\nline 2\n');

        const request = backrest.requests[0];
        expect(request?.headers['content-type']).toBe('application/connect+json');
        expect(request?.body.readUInt32BE(1)).toBe(request!.body.length - 5);
        expect(JSON.parse(request!.body.subarray(5).toString('utf8'))).toEqual({ref: 'log-1'});
    });

    it('throws the error of the end of a stream', async () => {
        backrest.on('/v1.Backrest/GetLogs', (_request, response) => {
            response.writeHead(200, {'content-type': 'application/connect+json'});
            response.end(FakeBackrest.frame({error: {code: 'not_found', message: 'log expired'}}, true));
        });
        const client = new BackrestAPIClient({url: backrest.url});

        await expect(client.getLogs('log-1')).rejects.toThrow('log expired');
    });

    it('stops endless streams after the duration and drops keep alives', async () => {
        backrest.on('/v1.Backrest/GetOperationEvents', (_request, response) => {
            response.writeHead(200, {'content-type': 'application/connect+json'});
            response.write(FakeBackrest.frame({keepAlive: {}}));
            response.write(FakeBackrest.frame({createdOperations: {operations: [{id: '1'}]}}));
        });
        const client = new BackrestAPIClient({url: backrest.url});

        expect(await client.getOperationEvents(300)).toEqual([{createdOperations: {operations: [{id: '1'}]}}]);
    });

    it('masks the remote config of peers', async () => {
        backrest.on('/v1sync.BackrestSyncStateService/GetPeerSyncStatesStream', (_request, response) => {
            response.writeHead(200, {'content-type': 'application/connect+json'});
            response.end(Buffer.concat([FakeBackrest.frame({peerInstanceId: 'eros', remoteConfig: {repos: [{id: 'r', password: 'x'}]}}), FakeBackrest.frame({}, true)]));
        });
        const client = new BackrestAPIClient({url: backrest.url});

        expect(await client.getPeerSyncStates()).toEqual([{peerInstanceId: 'eros', remoteConfig: {repos: [{id: 'r', password: '********'}]}}]);
        expect(JSON.parse(backrest.requests[0]!.body.subarray(5).toString('utf8'))).toEqual({subscribe: false});
    });

    it('builds absolute download links from the public URL', async () => {
        backrest.json('/v1.Backrest/GetDownloadURL', {value: './download/token-1/'});

        expect(await new BackrestAPIClient({url: backrest.url}).getDownloadURL('5', '/etc')).toBe(`${backrest.url}/download/token-1/`);
        expect(backrest.lastBody()).toEqual({filePath: '/etc', opId: '5'});
        expect(await new BackrestAPIClient({publicURL: 'https://backrest.example.com/', url: backrest.url}).getDownloadURL('5')).toBe('https://backrest.example.com/download/token-1/');
    });

    it('reads metrics, values and lists', async () => {
        backrest.on('/metrics', (request, response) => {
            response.writeHead(200, {'content-type': 'text/plain'}).end(`# ${request.method}\nbackrest_backups 3\n`);
        });
        backrest.json('/v1.Authentication/HashPassword', {value: '$2a$10$hash'});
        backrest.json('/v1.Backrest/PathAutocomplete', {values: ['etc', 'mnt']});
        backrest.json('/v1.Backrest/RunCommand', {operationId: '11'});
        backrest.json('/v1.Backrest/GeneratePairingToken', {token: 'key:secret#atlas'});
        const client = new BackrestAPIClient({url: backrest.url});

        expect(await client.getMetrics()).toBe('# GET\nbackrest_backups 3\n');
        expect(await client.hashPassword('pw')).toBe('$2a$10$hash');
        expect(backrest.lastBody()).toEqual({value: 'pw'});
        expect(await client.pathAutocomplete('/')).toEqual(['etc', 'mnt']);
        expect(await client.runCommand('nas', 'snapshots')).toBe('11');
        expect(await client.generatePairingToken({label: 'eros'})).toBe('key:secret#atlas');
    });
});
