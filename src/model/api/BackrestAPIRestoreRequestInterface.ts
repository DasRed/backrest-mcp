export default interface BackrestAPIRestoreRequestInterface {
    /** Path inside the snapshot, Backrest uses / when empty */
    path?: string;
    planId?: string;
    repoId: string;
    snapshotId: string;
    /** Target directory on the Backrest host, must not exist yet */
    target?: string;
}
