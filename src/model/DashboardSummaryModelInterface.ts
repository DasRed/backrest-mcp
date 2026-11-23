import type DashboardBackupModelInterface from '@/model/DashboardBackupModelInterface';

export default interface DashboardSummaryModelInterface {
    backupsFailedLast30days: number;
    backupsSuccessLast30days: number;
    backupsWarningLast30days: number;
    bytesAddedLast30days: number;
    bytesScannedLast30days: number;
    id: string;
    /** most recent backup, null if there is none in the last 30 days */
    lastBackup: DashboardBackupModelInterface | null;
    /** most recent backup that did not succeed */
    lastFailure: DashboardBackupModelInterface | null;
    /** null if the plan has no schedule */
    nextBackupTimeMs: number | null;
    /** the last successful backup is older than the schedule allows */
    overdue: boolean;
    protectedBytes: number;
}
