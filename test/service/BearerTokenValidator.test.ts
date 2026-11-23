import BearerTokenValidator from '@/service/BearerTokenValidator';
import {describe, expect, it} from 'vitest';

describe('BearerTokenValidator', () => {
    it('accepts everything without a token and only the exact header with one', () => {
        expect(BearerTokenValidator.isValid(undefined, '')).toBe(true);
        expect(BearerTokenValidator.isValid('Bearer secret', 'secret')).toBe(true);
        expect(BearerTokenValidator.isValid('Bearer wrong', 'secret')).toBe(false);
        expect(BearerTokenValidator.isValid(undefined, 'secret')).toBe(false);
    });
});
