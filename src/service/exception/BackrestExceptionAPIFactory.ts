import type BackrestAPIErrorInterface from '@/model/api/BackrestAPIErrorInterface';
import BackrestExceptionAPI from '@/service/exception/BackrestExceptionAPI';
import BackrestExceptionAPIFailedPrecondition from '@/service/exception/BackrestExceptionAPIFailedPrecondition';
import BackrestExceptionAPIInvalidArgument from '@/service/exception/BackrestExceptionAPIInvalidArgument';
import BackrestExceptionAPINotFound from '@/service/exception/BackrestExceptionAPINotFound';
import BackrestExceptionAPIPermissionDenied from '@/service/exception/BackrestExceptionAPIPermissionDenied';
import BackrestExceptionAPIUnauthenticated from '@/service/exception/BackrestExceptionAPIUnauthenticated';

interface BackrestExceptionAPIFactoryCreateOptionInterface {
    data: unknown;
    path: string;
    status: number;
}

const EXCEPTIONS = [
    BackrestExceptionAPIFailedPrecondition,
    BackrestExceptionAPIInvalidArgument,
    BackrestExceptionAPINotFound,
    BackrestExceptionAPIPermissionDenied,
    BackrestExceptionAPIUnauthenticated,
];

// HTTP status codes Connect uses for errors without a JSON body (e.g. the auth middleware of Backrest)
const STATUS_CODES: Record<number, string> = {
    400: 'invalid_argument',
    401: 'unauthenticated',
    403: 'permission_denied',
    404: 'not_found',
};

export default class BackrestExceptionAPIFactory {
    static create({data, path, status}: BackrestExceptionAPIFactoryCreateOptionInterface): BackrestExceptionAPI {
        const error     = BackrestExceptionAPIFactory.toError(data);
        const code      = error.code ?? STATUS_CODES[status] ?? 'unknown';
        const detail    = error.message ?? (typeof data === 'string' ? data.trim() : '');
        const message   = `Backrest ${path} failed with HTTP ${status} (${code})${detail !== '' ? `: ${detail}` : ''}`;
        const Exception = EXCEPTIONS.find((exception) => exception.identifier === code) ?? BackrestExceptionAPI;

        return new Exception(message, status, code, data);
    }

    protected static toError(data: unknown): BackrestAPIErrorInterface {
        if (data !== null && typeof data === 'object') {
            return data as BackrestAPIErrorInterface;
        }

        return {};
    }
}
