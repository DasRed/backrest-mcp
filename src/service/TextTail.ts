interface TextTailResultInterface {
    text: string;
    truncated: boolean;
}

export default class TextTail {
    // keeps the end of the text, errors of restic are usually at the end of the output
    static cut(text: string, maxBytes: number): TextTailResultInterface {
        const buffer = Buffer.from(text, 'utf8');
        if (buffer.length <= maxBytes) {
            return {text, truncated: false};
        }

        return {text: buffer.subarray(buffer.length - maxBytes).toString('utf8').replace(/^�+/, ''), truncated: true};
    }
}
