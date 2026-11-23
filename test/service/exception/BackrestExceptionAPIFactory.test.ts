import BackrestExceptionAPI from '@/service/exception/BackrestExceptionAPI';
import BackrestExceptionAPIFactory from '@/service/exception/BackrestExceptionAPIFactory';
import BackrestExceptionAPIFailedPrecondition from '@/service/exception/BackrestExceptionAPIFailedPrecondition';
import BackrestExceptionAPIPermissionDenied from '@/service/exception/BackrestExceptionAPIPermissionDenied';
import {describe, expect, it} from 'vitest';

describe('BackrestExceptionAPIFactory', () => {
    it('picks the exception by Connect code', () => {
        const error = BackrestExceptionAPIFactory.create({data: {code: 'failed_precondition', message: 'config modno mismatch, reload and try again'}, path: '/v1.Backrest/SetConfig', status: 400});

        expect(error).toBeInstanceOf(BackrestExceptionAPIFailedPrecondition);
        expect(error.message).toBe('Backrest /v1.Backrest/SetConfig failed with HTTP 400 (failed_precondition): config modno mismatch, reload and try again');
    });

    it('falls back to the HTTP status and the generic exception', () => {
        expect(BackrestExceptionAPIFactory.create({data: 'Forbidden', path: '/metrics', status: 403})).toBeInstanceOf(BackrestExceptionAPIPermissionDenied);

        const error = BackrestExceptionAPIFactory.create({data: null, path: '/x', status: 502});
        expect(error.constructor).toBe(BackrestExceptionAPI);
        expect(error.message).toBe('Backrest /x failed with HTTP 502 (unknown)');
    });
});
