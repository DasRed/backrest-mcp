import TextTail from '@/service/TextTail';
import {describe, expect, it} from 'vitest';

describe('TextTail', () => {
    it('keeps short texts and cuts long ones from the start', () => {
        expect(TextTail.cut('short', 100)).toEqual({text: 'short', truncated: false});
        expect(TextTail.cut('0123456789', 4)).toEqual({text: '6789', truncated: true});
        expect(TextTail.cut('äb', 2)).toEqual({text: 'b', truncated: true});
    });
});
