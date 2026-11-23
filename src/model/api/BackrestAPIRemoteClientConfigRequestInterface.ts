import type BackrestAPIPlanInterface from '@/model/api/BackrestAPIPlanInterface';
import type BackrestAPIRepoInterface from '@/model/api/BackrestAPIRepoInterface';

export default interface BackrestAPIRemoteClientConfigRequestInterface {
    peerKeyid: string;
    plans?: BackrestAPIPlanInterface[];
    plansToDelete?: string[];
    repos?: BackrestAPIRepoInterface[];
    reposToDelete?: string[];
}
