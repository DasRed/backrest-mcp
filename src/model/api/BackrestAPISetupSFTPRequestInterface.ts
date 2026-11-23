export default interface BackrestAPISetupSFTPRequestInterface {
    host: string;
    /** If missing, only the key is generated and the host is added to known_hosts */
    password?: string;
    port?: string;
    username: string;
}
