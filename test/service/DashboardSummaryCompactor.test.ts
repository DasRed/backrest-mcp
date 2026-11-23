import DashboardSummaryCompactor from '@/service/DashboardSummaryCompactor';
import {describe, expect, it} from 'vitest';

const DASHBOARD = {
    configPath:    '/config/config.json',
    planSummaries: [
        {
            backupsFailed30days:      '2',
            backupsSuccessLast30days: '28',
            bytesAddedLast30days:     '1000',
            bytesScannedLast30days:   '50000',
            historyLast30days:        [{overdue: true, timestampMs: '100'}, {overdue: false, timestampMs: '200'}],
            id:                       'daily',
            nextBackupTimeMs:         '9000',
            protectedBytes:           '4096',
            recentBackups:            {
                bytesAdded:  ['10', '20', '30'],
                durationMs:  ['1000', '2000', '3000'],
                flowId:      ['1', '2', '3'],
                status:      ['STATUS_SUCCESS', 'STATUS_ERROR', 'STATUS_SUCCESS'],
                timestampMs: ['3000', '2000', '1000'],
            },
        },
        {
            historyLast30days: [{overdue: true, timestampMs: '200'}],
            id:                'disabled',
        },
    ],
    repoSummaries: [{id: 'nas'}],
};

describe('DashboardSummaryCompactor', () => {
    it('keeps the numbers, the last backup and the last failure', () => {
        expect(DashboardSummaryCompactor.compact(DASHBOARD)).toEqual({
            plans: [
                {
                    backupsFailedLast30days:  2,
                    backupsSuccessLast30days: 28,
                    backupsWarningLast30days: 0,
                    bytesAddedLast30days:     1000,
                    bytesScannedLast30days:   50000,
                    id:                       'daily',
                    lastBackup:               {bytesAdded: 10, durationMs: 1000, flowId: '1', status: 'STATUS_SUCCESS', timestampMs: 3000},
                    lastFailure:              {bytesAdded: 20, durationMs: 2000, flowId: '2', status: 'STATUS_ERROR', timestampMs: 2000},
                    nextBackupTimeMs:         9000,
                    overdue:                  false,
                    protectedBytes:           4096,
                },
                {
                    backupsFailedLast30days:  0,
                    backupsSuccessLast30days: 0,
                    backupsWarningLast30days: 0,
                    bytesAddedLast30days:     0,
                    bytesScannedLast30days:   0,
                    id:                       'disabled',
                    lastBackup:               null,
                    lastFailure:              null,
                    nextBackupTimeMs:         null,
                    overdue:                  true,
                    protectedBytes:           0,
                },
            ],
            repos: [expect.objectContaining({id: 'nas', lastBackup: null})],
        });
    });

    it('filters plans and repositories', () => {
        expect(DashboardSummaryCompactor.filter(DASHBOARD, undefined, undefined)).toBe(DASHBOARD);
        expect(DashboardSummaryCompactor.filter(DASHBOARD, 'daily', undefined).planSummaries?.map((summary) => summary.id)).toEqual(['daily']);
        expect(DashboardSummaryCompactor.filter(DASHBOARD, 'daily', undefined).repoSummaries).toEqual([]);
        expect(DashboardSummaryCompactor.filter(DASHBOARD, undefined, 'nas')).toEqual({configPath: '/config/config.json', planSummaries: [], repoSummaries: [{id: 'nas'}]});
    });
});
