import BackrestException from '@/service/exception/BackrestException';

export default class BackrestExceptionUnknown extends BackrestException {
    public readonly data: unknown;

    constructor(data: unknown) {
        super(String(data));

        this.data = data;
    }
}
