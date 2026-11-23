import type BackrestAPISummaryInterface from '@/model/api/BackrestAPISummaryInterface';

export default interface BackrestAPISummaryDashboardInterface {
    configPath?: string;
    dataPath?: string;
    planSummaries?: BackrestAPISummaryInterface[];
    repoSummaries?: BackrestAPISummaryInterface[];
}
