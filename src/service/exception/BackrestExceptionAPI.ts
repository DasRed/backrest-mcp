import BackrestException from '@/service/exception/BackrestException';

export default class BackrestExceptionAPI extends BackrestException {
    public readonly code: string;
    public readonly data: unknown;
    public static readonly identifier: string = 'unknown';
    public readonly status: number;

    constructor(message: string, status: number, code: string, data: unknown) {
        super(message);

        this.code   = code;
        this.data   = data;
        this.status = status;
    }
}
