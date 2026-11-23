import BackrestProcedureEnum from '@/enum/BackrestProcedureEnum';
import type BackrestRepoTaskEnum from '@/enum/BackrestRepoTaskEnum';
import type BackrestAPIConfigInterface from '@/model/api/BackrestAPIConfigInterface';
import type BackrestAPIOperationEventInterface from '@/model/api/BackrestAPIOperationEventInterface';
import type BackrestAPIOperationInterface from '@/model/api/BackrestAPIOperationInterface';
import type BackrestAPIOperationListInterface from '@/model/api/BackrestAPIOperationListInterface';
import type BackrestAPIOperationSelectorInterface from '@/model/api/BackrestAPIOperationSelectorInterface';
import type BackrestAPIPairingTokenRequestInterface from '@/model/api/BackrestAPIPairingTokenRequestInterface';
import type BackrestAPIPeerStateInterface from '@/model/api/BackrestAPIPeerStateInterface';
import type BackrestAPIRemoteClientConfigRequestInterface from '@/model/api/BackrestAPIRemoteClientConfigRequestInterface';
import type BackrestAPIRepoInterface from '@/model/api/BackrestAPIRepoInterface';
import type BackrestAPIRestoreRequestInterface from '@/model/api/BackrestAPIRestoreRequestInterface';
import type BackrestAPIScheduleTaskResponseInterface from '@/model/api/BackrestAPIScheduleTaskResponseInterface';
import type BackrestAPISetupSFTPRequestInterface from '@/model/api/BackrestAPISetupSFTPRequestInterface';
import type BackrestAPIStringListInterface from '@/model/api/BackrestAPIStringListInterface';
import type BackrestAPISummaryDashboardInterface from '@/model/api/BackrestAPISummaryDashboardInterface';
import type BackrestAPIValueInterface from '@/model/api/BackrestAPIValueInterface';
import BackrestSecretMasker from '@/service/BackrestSecretMasker';
import ConnectEnvelopeDecoder from '@/service/ConnectEnvelopeDecoder';
import BackrestExceptionAPIFactory from '@/service/exception/BackrestExceptionAPIFactory';
import BackrestExceptionConfiguration from '@/service/exception/BackrestExceptionConfiguration';
import BackrestExceptionConnection from '@/service/exception/BackrestExceptionConnection';
import BackrestExceptionConverter from '@/service/exception/BackrestExceptionConverter';
import BackrestExceptionTimeout from '@/service/exception/BackrestExceptionTimeout';

interface BackrestAPIClientConstructorOptionInterface {
    masker?: BackrestSecretMasker;
    password?: string;
    publicURL?: string;
    timeout?: number;
    url: string;
    username?: string;
}

interface BackrestAPIClientCallOptionInterface {
    timeout?: number;
}

interface BackrestAPIClientStreamOptionInterface {
    /** maximum time to read the stream in milliseconds; what arrived until then is returned */
    duration: number;
}

export default class BackrestAPIClient {
    protected readonly authorization: string | null;
    protected readonly masker: BackrestSecretMasker;
    protected readonly publicURL: string;
    protected readonly timeout: number;
    protected readonly url: string;

    get authenticated(): boolean {
        return this.authorization !== null;
    }

    constructor({masker = new BackrestSecretMasker(), password = '', publicURL = '', timeout = 60000, url, username = ''}: BackrestAPIClientConstructorOptionInterface) {
        if ((username === '') !== (password === '')) {
            throw new BackrestExceptionConfiguration('Backrest username and password must be set together or both left empty');
        }

        this.authorization = username === '' ? null : `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`;
        this.masker        = masker;
        this.timeout       = timeout;
        this.url           = url.replace(/\/+$/, '');
        this.publicURL     = publicURL === '' ? this.url : publicURL.replace(/\/+$/, '');
    }

    async addRepo(repo: BackrestAPIRepoInterface): Promise<BackrestAPIConfigInterface> {
        const current = await this.call<BackrestAPIConfigInterface>(BackrestProcedureEnum.GET_CONFIG);
        const config  = await this.call<BackrestAPIConfigInterface>(BackrestProcedureEnum.ADD_REPO, {repo: this.masker.restoreRepo(repo, current.repos?.find((entry) => entry.id === repo.id))});

        return this.masker.maskConfig(config);
    }

    // Backrest answers a backup request only when the backup is finished. After `wait` milliseconds the request is
    // given up, the backup keeps running in Backrest.
    async backup(planId: string, dryRun: boolean, wait: number): Promise<boolean> {
        try {
            await this.call(BackrestProcedureEnum.BACKUP, {dryRun, value: planId}, {timeout: wait});
        }
        catch (error) {
            if (error instanceof BackrestExceptionTimeout) {
                return false;
            }

            throw error;
        }

        return true;
    }

    protected async call<T>(procedure: BackrestProcedureEnum, body: unknown = {}, {timeout = this.timeout}: BackrestAPIClientCallOptionInterface = {}): Promise<T> {
        const response = await this.send(procedure, timeout, {
            body:    JSON.stringify(body),
            headers: {'content-type': 'application/json'},
        });

        let data: unknown;
        try {
            data = await this.parse(response);
        }
        catch (error) {
            throw this.convertError(error, procedure, timeout);
        }

        if (response.ok === false) {
            throw BackrestExceptionAPIFactory.create({data, path: procedure, status: response.status});
        }

        return (data ?? {}) as T;
    }

    async cancel(operationId: string): Promise<void> {
        await this.call(BackrestProcedureEnum.CANCEL, {operationId});
    }

    async checkRepoExists(repo: BackrestAPIRepoInterface): Promise<Record<string, unknown>> {
        const current = await this.call<BackrestAPIConfigInterface>(BackrestProcedureEnum.GET_CONFIG);

        return this.call(BackrestProcedureEnum.CHECK_REPO_EXISTS, {repo: this.masker.restoreRepo(repo, current.repos?.find((entry) => entry.id === repo.id))});
    }

    async clearHistory(selector: BackrestAPIOperationSelectorInterface, onlyFailed: boolean): Promise<void> {
        await this.call(BackrestProcedureEnum.CLEAR_HISTORY, {onlyFailed, selector});
    }

    protected convertError(error: unknown, path: string, timeout: number): Error {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            return new BackrestExceptionTimeout(path, timeout);
        }
        // undici reports network errors as TypeError "fetch failed" with the real reason as cause
        if (error instanceof TypeError && error.cause !== undefined) {
            return new BackrestExceptionConnection(this.url, error);
        }

        return BackrestExceptionConverter.convert(error);
    }

    async doRepoTask(repoId: string, task: BackrestRepoTaskEnum): Promise<BackrestAPIScheduleTaskResponseInterface> {
        return this.call(BackrestProcedureEnum.DO_REPO_TASK, {repoId, task});
    }

    async forget(repoId: string, planId: string, snapshotId: string = ''): Promise<BackrestAPIScheduleTaskResponseInterface> {
        return this.call(BackrestProcedureEnum.FORGET, {planId, repoId, snapshotId});
    }

    async generatePairingToken(request: BackrestAPIPairingTokenRequestInterface): Promise<string> {
        const response = await this.call<{token?: string}>(BackrestProcedureEnum.GENERATE_PAIRING_TOKEN, request);

        return response.token ?? '';
    }

    async getConfig(): Promise<BackrestAPIConfigInterface> {
        return this.masker.maskConfig(await this.call<BackrestAPIConfigInterface>(BackrestProcedureEnum.GET_CONFIG));
    }

    async getDownloadURL(operationId: string, filePath: string = ''): Promise<string> {
        const response = await this.call<BackrestAPIValueInterface<string>>(BackrestProcedureEnum.GET_DOWNLOAD_URL, {filePath, opId: operationId});

        // Backrest returns a relative path like ./download/<token>/
        return new URL(response.value ?? '', `${this.publicURL}/`).toString();
    }

    async getLogs(ref: string, duration: number = this.timeout): Promise<string> {
        const chunks = await this.stream<BackrestAPIValueInterface<string>>(BackrestProcedureEnum.GET_LOGS, {ref}, {duration});

        // bytes are base64 in the JSON of Backrest
        return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk.value ?? '', 'base64'))).toString('utf8');
    }

    async getMetrics(): Promise<string> {
        const response = await this.send('/metrics', this.timeout, {method: 'GET'});
        const text     = await response.text();
        if (response.ok === false) {
            throw BackrestExceptionAPIFactory.create({data: text, path: '/metrics', status: response.status});
        }

        return text;
    }

    async getOperation(operationId: string): Promise<BackrestAPIOperationInterface | null> {
        const operations = await this.getOperations({ids: [operationId]});

        return operations[0] ?? null;
    }

    async getOperationEvents(duration: number): Promise<BackrestAPIOperationEventInterface[]> {
        const events = await this.stream<BackrestAPIOperationEventInterface>(BackrestProcedureEnum.GET_OPERATION_EVENTS, {}, {duration});

        return events.filter((event) => event.keepAlive === undefined);
    }

    async getOperations(selector: BackrestAPIOperationSelectorInterface, lastN: number = 0): Promise<BackrestAPIOperationInterface[]> {
        const response = await this.call<BackrestAPIOperationListInterface>(BackrestProcedureEnum.GET_OPERATIONS, {lastN, selector});

        return response.operations ?? [];
    }

    async getPeerSyncStates(): Promise<BackrestAPIPeerStateInterface[]> {
        const states = await this.stream<BackrestAPIPeerStateInterface>(BackrestProcedureEnum.GET_PEER_SYNC_STATES, {subscribe: false}, {duration: this.timeout});

        return states.map((state) => this.masker.maskPeerState(state));
    }

    async getSummaryDashboard(): Promise<BackrestAPISummaryDashboardInterface> {
        return this.call(BackrestProcedureEnum.GET_SUMMARY_DASHBOARD);
    }

    async hashPassword(password: string): Promise<string> {
        const response = await this.call<BackrestAPIValueInterface<string>>(BackrestProcedureEnum.HASH_PASSWORD, {value: password});

        return response.value ?? '';
    }

    async listSnapshotFiles(repoId: string, snapshotId: string, path: string): Promise<Record<string, unknown>> {
        return this.call(BackrestProcedureEnum.LIST_SNAPSHOT_FILES, {path, repoId, snapshotId});
    }

    async listSnapshots(repoId: string, planId: string = ''): Promise<Record<string, unknown>[]> {
        const response = await this.call<{snapshots?: Record<string, unknown>[]}>(BackrestProcedureEnum.LIST_SNAPSHOTS, {planId, repoId});

        return response.snapshots ?? [];
    }

    protected async parse(response: Response): Promise<unknown> {
        const text = await response.text();
        if (text === '') {
            return null;
        }

        try {
            return JSON.parse(text);
        }
        catch {
            return text;
        }
    }

    async pathAutocomplete(path: string): Promise<string[]> {
        const response = await this.call<BackrestAPIStringListInterface>(BackrestProcedureEnum.PATH_AUTOCOMPLETE, {value: path});

        return response.values ?? [];
    }

    async removeRepo(repoId: string): Promise<BackrestAPIConfigInterface> {
        return this.masker.maskConfig(await this.call<BackrestAPIConfigInterface>(BackrestProcedureEnum.REMOVE_REPO, {repoId}));
    }

    async restore(request: BackrestAPIRestoreRequestInterface): Promise<BackrestAPIScheduleTaskResponseInterface> {
        return this.call(BackrestProcedureEnum.RESTORE, request);
    }

    async runCommand(repoId: string, command: string): Promise<string> {
        const response = await this.call<{operationId?: string}>(BackrestProcedureEnum.RUN_COMMAND, {command, repoId});

        return response.operationId ?? '';
    }

    protected async send(path: string, timeout: number, init: RequestInit): Promise<Response> {
        const headers: Record<string, string> = {
            'accept':                   'application/json',
            'connect-protocol-version': '1',
            ...init.headers as Record<string, string>,
        };
        if (this.authorization !== null) {
            headers.authorization = this.authorization;
        }

        try {
            return await fetch(`${this.url}${path}`, {
                cache:  'no-cache',
                method: 'POST',
                signal: AbortSignal.timeout(timeout),
                ...init,
                headers: headers,
            });
        }
        catch (error) {
            throw this.convertError(error, path, timeout);
        }
    }

    async setConfig(config: BackrestAPIConfigInterface): Promise<BackrestAPIConfigInterface> {
        const current = await this.call<BackrestAPIConfigInterface>(BackrestProcedureEnum.GET_CONFIG);
        const updated = await this.call<BackrestAPIConfigInterface>(BackrestProcedureEnum.SET_CONFIG, this.masker.restoreConfig(config, current));

        return this.masker.maskConfig(updated);
    }

    async setRemoteClientConfig(request: BackrestAPIRemoteClientConfigRequestInterface): Promise<void> {
        await this.call(BackrestProcedureEnum.SET_REMOTE_CLIENT_CONFIG, request);
    }

    async setupSFTP(request: BackrestAPISetupSFTPRequestInterface): Promise<Record<string, unknown>> {
        return this.call(BackrestProcedureEnum.SETUP_SFTP, request);
    }

    // Streams like GetOperationEvents never end on their own, so reading stops after `duration` and the messages
    // received so far are returned.
    protected async stream<T>(procedure: BackrestProcedureEnum, body: unknown, {duration}: BackrestAPIClientStreamOptionInterface): Promise<T[]> {
        const controller = new AbortController();
        const timer      = setTimeout(() => controller.abort(), duration);
        const messages: T[] = [];
        let started         = false;

        try {
            const response = await this.send(procedure, duration, {
                body:    ConnectEnvelopeDecoder.encode(body),
                headers: {'content-type': 'application/connect+json'},
                signal:  controller.signal,
            });
            started = true;

            if (response.ok === false || response.body === null) {
                throw BackrestExceptionAPIFactory.create({data: await this.parse(response), path: procedure, status: response.status});
            }

            const decoder = new ConnectEnvelopeDecoder();
            for await (const chunk of response.body) {
                for (const frame of decoder.push(chunk)) {
                    if (frame.endStream === false) {
                        messages.push(frame.data as T);
                        continue;
                    }

                    const error = (frame.data as {error?: unknown}).error;
                    if (error != null) {
                        throw BackrestExceptionAPIFactory.create({data: error, path: procedure, status: 200});
                    }

                    return messages;
                }
            }
        }
        catch (error) {
            if (started === true && controller.signal.aborted === true) {
                return messages;
            }

            throw this.convertError(error, procedure, duration);
        }
        finally {
            clearTimeout(timer);
            controller.abort();
        }

        return messages;
    }
}
