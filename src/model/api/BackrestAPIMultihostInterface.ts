import type BackrestAPIPairingTokenInterface from '@/model/api/BackrestAPIPairingTokenInterface';
import type BackrestAPIPeerInterface from '@/model/api/BackrestAPIPeerInterface';

export default interface BackrestAPIMultihostInterface {
    [key: string]: unknown;
    authorizedClients?: BackrestAPIPeerInterface[];
    knownHosts?: BackrestAPIPeerInterface[];
    pairingTokens?: BackrestAPIPairingTokenInterface[];
}
