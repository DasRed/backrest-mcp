import type BackrestAPISummaryDashboardInterface from '@/model/api/BackrestAPISummaryDashboardInterface';
import type BackrestAPISummaryInterface from '@/model/api/BackrestAPISummaryInterface';
import type DashboardBackupModelInterface from '@/model/DashboardBackupModelInterface';
import type DashboardModelInterface from '@/model/DashboardModelInterface';
import type DashboardSummaryModelInterface from '@/model/DashboardSummaryModelInterface';

const STATUS_SUCCESS = 'STATUS_SUCCESS';

// The dashboard of Backrest carries per-day history and charts for every plan and repository, several 100 KB for a
// few dozen plans. The compact form keeps the numbers and the last backup and failure.
export default class DashboardSummaryCompactor {
    static compact(dashboard: BackrestAPISummaryDashboardInterface): DashboardModelInterface {
        return {
            plans: (dashboard.planSummaries ?? []).map((summary) => DashboardSummaryCompactor.compactSummary(summary)),
            repos: (dashboard.repoSummaries ?? []).map((summary) => DashboardSummaryCompactor.compactSummary(summary)),
        };
    }

    static compactSummary(summary: BackrestAPISummaryInterface): DashboardSummaryModelInterface {
        const backups     = DashboardSummaryCompactor.toBackups(summary).sort((a, b) => b.timestampMs - a.timestampMs);
        const nextBackup  = DashboardSummaryCompactor.toNumber(summary.nextBackupTimeMs);
        const lastHistory = summary.historyLast30days?.at(-1);

        return {
            backupsFailedLast30days:  DashboardSummaryCompactor.toNumber(summary.backupsFailed30days),
            backupsSuccessLast30days: DashboardSummaryCompactor.toNumber(summary.backupsSuccessLast30days),
            backupsWarningLast30days: DashboardSummaryCompactor.toNumber(summary.backupsWarningLast30days),
            bytesAddedLast30days:     DashboardSummaryCompactor.toNumber(summary.bytesAddedLast30days),
            bytesScannedLast30days:   DashboardSummaryCompactor.toNumber(summary.bytesScannedLast30days),
            id:                       summary.id,
            lastBackup:               backups[0] ?? null,
            lastFailure:              backups.find((backup) => backup.status !== STATUS_SUCCESS) ?? null,
            nextBackupTimeMs:         nextBackup === 0 ? null : nextBackup,
            overdue:                  lastHistory?.overdue === true,
            protectedBytes:           DashboardSummaryCompactor.toNumber(summary.protectedBytes),
        };
    }

    static filter(dashboard: BackrestAPISummaryDashboardInterface, planId: string | undefined, repoId: string | undefined): BackrestAPISummaryDashboardInterface {
        if (planId === undefined && repoId === undefined) {
            return dashboard;
        }

        return {
            ...dashboard,
            planSummaries: planId === undefined ? [] : (dashboard.planSummaries ?? []).filter((summary) => summary.id === planId),
            repoSummaries: repoId === undefined ? [] : (dashboard.repoSummaries ?? []).filter((summary) => summary.id === repoId),
        };
    }

    protected static toBackups(summary: BackrestAPISummaryInterface): DashboardBackupModelInterface[] {
        const chart = summary.recentBackups ?? {};

        return (chart.timestampMs ?? []).map((timestamp, index) => ({
            bytesAdded:  DashboardSummaryCompactor.toNumber(chart.bytesAdded?.[index]),
            durationMs:  DashboardSummaryCompactor.toNumber(chart.durationMs?.[index]),
            flowId:      chart.flowId?.[index] ?? '',
            status:      chart.status?.[index] ?? 'STATUS_UNKNOWN',
            timestampMs: DashboardSummaryCompactor.toNumber(timestamp),
        }));
    }

    // int64 values are strings in the JSON of Backrest, the numbers here stay far below 2^53
    protected static toNumber(value: string | undefined): number {
        const parsed = Number(value ?? 0);

        return Number.isFinite(parsed) ? parsed : 0;
    }
}
