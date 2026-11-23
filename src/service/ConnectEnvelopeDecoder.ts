import type ConnectFrameInterface from '@/interface/ConnectFrameInterface';

// a Connect envelope is 1 byte of flags plus a 4 byte big endian length, followed by the message
const HEADER_LENGTH   = 5;
const FLAG_END_STREAM = 0x02;

export default class ConnectEnvelopeDecoder {
    protected buffer: Buffer = Buffer.alloc(0);

    static encode(message: unknown): Uint8Array<ArrayBuffer> {
        const payload = Buffer.from(JSON.stringify(message ?? {}), 'utf8');
        const bytes   = new Uint8Array(HEADER_LENGTH + payload.length);

        // flags 0: uncompressed message
        new DataView(bytes.buffer).setUint32(1, payload.length);
        bytes.set(payload, HEADER_LENGTH);

        return bytes;
    }

    push(chunk: Uint8Array): ConnectFrameInterface[] {
        this.buffer = Buffer.concat([this.buffer, Buffer.from(chunk)]);

        const frames: ConnectFrameInterface[] = [];
        while (this.buffer.length >= HEADER_LENGTH) {
            const flags  = this.buffer.readUInt8(0);
            const length = this.buffer.readUInt32BE(1);
            if (this.buffer.length < HEADER_LENGTH + length) {
                break;
            }

            const payload = this.buffer.subarray(HEADER_LENGTH, HEADER_LENGTH + length).toString('utf8');
            this.buffer   = this.buffer.subarray(HEADER_LENGTH + length);

            frames.push({data: payload === '' ? {} : JSON.parse(payload), endStream: (flags & FLAG_END_STREAM) === FLAG_END_STREAM});
        }

        return frames;
    }
}
