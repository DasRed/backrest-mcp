import type BackrestAPIBackupChartInterface from '@/model/api/BackrestAPIBackupChartInterface';
import type BackrestAPIDayStatusBucketInterface from '@/model/api/BackrestAPIDayStatusBucketInterface';

export default interface BackrestAPISummaryInterface {
    backupsFailed30days?: string;
    backupsSuccessLast30days?: string;
    backupsWarningLast30days?: string;
    bytesAddedAvg?: string;
    bytesAddedLast30days?: string;
    bytesScannedAvg?: string;
    bytesScannedLast30days?: string;
    /** oldest first */
    historyLast30days?: BackrestAPIDayStatusBucketInterface[];
    id: string;
    nextBackupTimeMs?: string;
    /** bytes processed by the most recent successful backup */
    protectedBytes?: string;
    recentBackups?: BackrestAPIBackupChartInterface;
    totalSnapshots?: string;
}
