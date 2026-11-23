export default interface BackrestAPIDayStatusBucketInterface {
    bytesAdded?: string;
    bytesScanned?: string;
    /** the gap since the last good backup exceeded the schedule on this day */
    overdue?: boolean;
    statusCounts?: {count?: string; status?: string}[];
    /** start of the day */
    timestampMs?: string;
}
