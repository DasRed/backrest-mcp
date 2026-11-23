import type BackrestAPIPlanInterface from '@/model/api/BackrestAPIPlanInterface';
import type BackrestAPIRepoInterface from '@/model/api/BackrestAPIRepoInterface';

export default interface BackrestAPIPeerStateInterface {
    [key: string]: unknown;
    remoteConfig?: {
        [key: string]: unknown;
        plans?: BackrestAPIPlanInterface[];
        repos?: BackrestAPIRepoInterface[];
    };
}
