interface ToolFilterOptionInterface {
    allow: string[];
    deny: string[];
    readOnly: boolean;
}

interface ToolFilterToolInterface {
    name: string;
    readOnly: boolean;
}

export default class ToolFilter {
    static isEnabled(tool: ToolFilterToolInterface, {allow, deny, readOnly}: ToolFilterOptionInterface): boolean {
        if (readOnly === true && tool.readOnly === false) {
            return false;
        }
        if (allow.length > 0 && ToolFilter.matchesAny(tool.name, allow) === false) {
            return false;
        }

        return ToolFilter.matchesAny(tool.name, deny) === false;
    }

    static matches(name: string, pattern: string): boolean {
        const expression = pattern.split('*')
                                  .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
                                  .join('.*');

        return new RegExp(`^${expression}$`).test(name);
    }

    static matchesAny(name: string, patterns: string[]): boolean {
        return patterns.some((pattern) => ToolFilter.matches(name, pattern));
    }
}
