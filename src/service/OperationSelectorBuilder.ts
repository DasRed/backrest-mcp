import type BackrestAPIOperationSelectorInterface from '@/model/api/BackrestAPIOperationSelectorInterface';
import type BackrestAPIClient from '@/service/BackrestAPIClient';
import BackrestExceptionAPINotFound from '@/service/exception/BackrestExceptionAPINotFound';

interface OperationSelectorBuilderOptionInterface {
    flowId?: string;
    ids?: string[];
    instanceId?: string;
    planId?: string;
    repoGuid?: string;
    /** resolved to the GUID of the repository, Backrest selects operations by GUID only */
    repoId?: string;
    snapshotId?: string;
}

export default class OperationSelectorBuilder {
    static async build(client: BackrestAPIClient, {flowId, ids, instanceId, planId, repoGuid, repoId, snapshotId}: OperationSelectorBuilderOptionInterface): Promise<BackrestAPIOperationSelectorInterface> {
        const selector: BackrestAPIOperationSelectorInterface = {};

        if (ids !== undefined && ids.length > 0) {
            // Backrest rejects selectors that combine IDs with other fields
            return {ids};
        }
        if (repoId !== undefined && repoId !== '') {
            const config = await client.getConfig();
            const repo   = config.repos?.find((entry) => entry.id === repoId);
            if (repo?.guid === undefined || repo.guid === '') {
                throw new BackrestExceptionAPINotFound(`Repository "${repoId}" not found`, 404, 'not_found', null);
            }

            selector.repoGuid = repo.guid;
        }
        if (repoGuid !== undefined && repoGuid !== '') {
            selector.repoGuid = repoGuid;
        }
        if (planId !== undefined && planId !== '') {
            selector.planId = planId;
        }
        if (snapshotId !== undefined && snapshotId !== '') {
            selector.snapshotId = snapshotId;
        }
        if (flowId !== undefined && flowId !== '') {
            selector.flowId = flowId;
        }
        if (instanceId !== undefined && instanceId !== '') {
            selector.instanceId = instanceId;
        }

        return selector;
    }
}
