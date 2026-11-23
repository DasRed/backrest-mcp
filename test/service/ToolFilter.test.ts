import ToolFilter from '@/service/ToolFilter';
import {describe, expect, it} from 'vitest';

const read  = {name: 'get_config', readOnly: true};
const write = {name: 'remove_repo', readOnly: false};

describe('ToolFilter', () => {
    it('drops write tools in read-only mode', () => {
        expect(ToolFilter.isEnabled(read, {allow: [], deny: [], readOnly: true})).toBe(true);
        expect(ToolFilter.isEnabled(write, {allow: [], deny: [], readOnly: true})).toBe(false);
        expect(ToolFilter.isEnabled(write, {allow: [], deny: [], readOnly: false})).toBe(true);
    });

    it('applies allow and deny lists with wildcards', () => {
        expect(ToolFilter.isEnabled(read, {allow: ['get_*'], deny: [], readOnly: false})).toBe(true);
        expect(ToolFilter.isEnabled(write, {allow: ['get_*'], deny: [], readOnly: false})).toBe(false);
        expect(ToolFilter.isEnabled(write, {allow: [], deny: ['*_repo'], readOnly: false})).toBe(false);
        expect(ToolFilter.isEnabled(read, {allow: ['*'], deny: ['get_config'], readOnly: false})).toBe(false);
    });

    it('treats regex characters in patterns literally', () => {
        expect(ToolFilter.matches('get_config', 'get.config')).toBe(false);
        expect(ToolFilter.matches('get_config', 'get_con*')).toBe(true);
    });
});
