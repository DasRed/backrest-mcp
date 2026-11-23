import type DashboardSummaryModelInterface from '@/model/DashboardSummaryModelInterface';

export default interface DashboardModelInterface {
    plans: DashboardSummaryModelInterface[];
    repos: DashboardSummaryModelInterface[];
}
