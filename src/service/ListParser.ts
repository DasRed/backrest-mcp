export default class ListParser {
    static parse(value: string): string[] {
        return value.split(',')
                    .map((entry) => entry.trim())
                    .filter((entry) => entry !== '');
    }
}
