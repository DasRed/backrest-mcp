import BackrestException from '@/service/exception/BackrestException';

export default class BackrestExceptionUnknownError extends BackrestException {
    public readonly error: Error;

    constructor(error: Error) {
        super(error.message);

        this.error = error;
    }
}
