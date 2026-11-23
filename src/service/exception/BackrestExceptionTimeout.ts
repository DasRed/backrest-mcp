import BackrestException from '@/service/exception/BackrestException';

export default class BackrestExceptionTimeout extends BackrestException {
    public readonly path: string;
    public readonly timeout: number;

    constructor(path: string, timeout: number) {
        super(`Backrest ${path} did not answer within ${timeout} ms`);

        this.path    = path;
        this.timeout = timeout;
    }
}
