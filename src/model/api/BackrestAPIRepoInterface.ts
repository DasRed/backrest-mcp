import type BackrestAPIHookInterface from '@/model/api/BackrestAPIHookInterface';

export default interface BackrestAPIRepoInterface {
    [key: string]: unknown;
    /** Extra environment variables for restic as KEY=VALUE */
    env?: string[];
    guid?: string;
    hooks?: BackrestAPIHookInterface[];
    id: string;
    password?: string;
    uri?: string;
}
