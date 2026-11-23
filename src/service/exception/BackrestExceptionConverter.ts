import BackrestException from '@/service/exception/BackrestException';
import BackrestExceptionUnknown from '@/service/exception/BackrestExceptionUnknown';
import BackrestExceptionUnknownError from '@/service/exception/BackrestExceptionUnknownError';

export default class BackrestExceptionConverter {
    static convert(error: unknown): BackrestException {
        if (error instanceof BackrestException) {
            return error;
        }
        if (error instanceof Error) {
            return new BackrestExceptionUnknownError(error);
        }

        return new BackrestExceptionUnknown(error);
    }
}
