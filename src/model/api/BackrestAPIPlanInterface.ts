import type BackrestAPIHookInterface from '@/model/api/BackrestAPIHookInterface';

export default interface BackrestAPIPlanInterface {
    [key: string]: unknown;
    hooks?: BackrestAPIHookInterface[];
    id: string;
    repo?: string;
}
