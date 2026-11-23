export default interface BackrestAPIPairingTokenRequestInterface {
    label?: string;
    /** 0 means unlimited */
    maxUses?: number;
    permissions?: {scopes?: string[]; type: string}[];
    ttlSeconds?: number;
}
