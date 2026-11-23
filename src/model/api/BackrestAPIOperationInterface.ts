export default interface BackrestAPIOperationInterface {
    [key: string]: unknown;
    displayMessage?: string;
    flowId?: string;
    /** int64 values are strings in the JSON of Backrest */
    id: string;
    logref?: string;
    operationCheck?: {outputLogref?: string};
    operationIndexSnapshot?: Record<string, unknown>;
    operationPrune?: {outputLogref?: string};
    operationRestore?: Record<string, unknown>;
    operationRunCommand?: {command?: string; outputLogref?: string; outputSizeBytes?: string};
    operationRunHook?: {outputLogref?: string};
    planId?: string;
    repoGuid?: string;
    repoId?: string;
    snapshotId?: string;
    status?: string;
}
