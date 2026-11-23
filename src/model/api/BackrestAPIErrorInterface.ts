export default interface BackrestAPIErrorInterface {
    /** Connect error code in snake_case, e.g. not_found */
    code?: string;
    details?: unknown[];
    message?: string;
}
