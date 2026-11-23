import ConnectEnvelopeDecoder from '@/service/ConnectEnvelopeDecoder';
import {describe, expect, it} from 'vitest';

describe('ConnectEnvelopeDecoder', () => {
    it('encodes a message with flags and length', () => {
        const encoded = Buffer.from(ConnectEnvelopeDecoder.encode({ref: 'ä'}));

        expect(encoded.readUInt8(0)).toBe(0);
        expect(encoded.readUInt32BE(1)).toBe(encoded.length - 5);
        expect(JSON.parse(encoded.subarray(5).toString('utf8'))).toEqual({ref: 'ä'});
    });

    it('decodes frames split across chunks and marks the end of the stream', () => {
        const decoder = new ConnectEnvelopeDecoder();
        const first   = Buffer.from(ConnectEnvelopeDecoder.encode({a: 1}));
        const last    = Buffer.from(ConnectEnvelopeDecoder.encode({}));
        last.writeUInt8(2, 0);

        const all = Buffer.concat([first, last]);

        expect(decoder.push(all.subarray(0, 3))).toEqual([]);
        expect(decoder.push(all.subarray(3, first.length + 2))).toEqual([{data: {a: 1}, endStream: false}]);
        expect(decoder.push(all.subarray(first.length + 2))).toEqual([{data: {}, endStream: true}]);
    });
});
