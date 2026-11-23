import type BackrestAPIOperationListInterface from '@/model/api/BackrestAPIOperationListInterface';

export default interface BackrestAPIOperationEventInterface {
    createdOperations?: BackrestAPIOperationListInterface;
    deletedOperations?: {values?: string[]};
    keepAlive?: Record<string, never>;
    updatedOperations?: BackrestAPIOperationListInterface;
}
