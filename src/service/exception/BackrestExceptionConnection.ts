import BackrestException from '@/service/exception/BackrestException';

export default class BackrestExceptionConnection extends BackrestException {
    public readonly error: Error;
    public readonly url: string;

    constructor(url: string, error: Error) {
        const cause = error.cause instanceof Error ? error.cause.message : error.message;

        super(`Backrest is not reachable at ${url}: ${cause}`);

        this.error = error;
        this.url   = url;
    }
}
