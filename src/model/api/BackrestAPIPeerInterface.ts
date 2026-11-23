export default interface BackrestAPIPeerInterface {
    [key: string]: unknown;
    initialPairingSecret?: string;
    instanceId?: string;
    keyId?: string;
}
