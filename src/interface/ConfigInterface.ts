export default interface ConfigInterface {
    backrest: {
        /** Password for HTTP basic auth, only used together with username */
        password: string;
        /** Base URL used in download links handed out to the client, defaults to url */
        publicURL: string;
        /** Timeout of a single request against Backrest in milliseconds */
        timeout: number;
        url: string;
        /** User for HTTP basic auth; empty means Backrest runs without authentication */
        username: string;
    };
    mcp: {
        /** Optional bearer token required on the MCP endpoint */
        authToken: string;
        /** Replace repository passwords and hook secrets in returned configs with ******** */
        maskSecrets: boolean;
        path: string;
        readOnly: boolean;
        /** Tool name patterns to keep, * as wildcard; empty keeps all */
        toolsAllow: string[];
        /** Tool name patterns to remove, * as wildcard */
        toolsDeny: string[];
    };
    server: {
        host: string;
        logLevel: string;
        port: number;
    };
}
