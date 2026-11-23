import type BackrestAPIOperationInterface from '@/model/api/BackrestAPIOperationInterface';

export default class OperationLogReference {
    static get(operation: BackrestAPIOperationInterface): string {
        return operation.operationRunCommand?.outputLogref
            ?? operation.operationPrune?.outputLogref
            ?? operation.operationCheck?.outputLogref
            ?? operation.operationRunHook?.outputLogref
            ?? operation.logref
            ?? '';
    }
}
