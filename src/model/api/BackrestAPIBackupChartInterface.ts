export default interface BackrestAPIBackupChartInterface {
    /** parallel arrays, one entry per backup */
    bytesAdded?: string[];
    durationMs?: string[];
    flowId?: string[];
    status?: string[];
    timestampMs?: string[];
}
