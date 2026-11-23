export default interface BackrestAPIOperationSelectorInterface {
    flowId?: string;
    /** Operation IDs, cannot be combined with the other fields */
    ids?: string[];
    instanceId?: string;
    modnoGte?: string;
    originalInstanceKeyid?: string;
    planId?: string;
    repoGuid?: string;
    snapshotId?: string;
}
