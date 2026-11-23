import type BackrestAPIMultihostInterface from '@/model/api/BackrestAPIMultihostInterface';
import type BackrestAPIPlanInterface from '@/model/api/BackrestAPIPlanInterface';
import type BackrestAPIRepoInterface from '@/model/api/BackrestAPIRepoInterface';

export default interface BackrestAPIConfigInterface {
    [key: string]: unknown;
    auth?: Record<string, unknown>;
    instance?: string;
    /** Modification number, SetConfig is rejected unless it matches the stored config */
    modno?: number;
    plans?: BackrestAPIPlanInterface[];
    repos?: BackrestAPIRepoInterface[];
    /** Multihost settings, the JSON name in Backrest is "sync" */
    sync?: BackrestAPIMultihostInterface;
}
