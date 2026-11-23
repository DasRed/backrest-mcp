import type BackrestAPIClient from '@/service/BackrestAPIClient';
import {vi} from 'vitest';

// all client methods as mocks, override the ones a test needs
export default function createFakeBackrestAPIClient(overrides: Partial<Record<keyof BackrestAPIClient, unknown>> = {}): BackrestAPIClient {
    return {
        getConfig:     vi.fn().mockResolvedValue({repos: [{guid: 'guid-nas', id: 'nas'}]}),
        getLogs:       vi.fn().mockResolvedValue('log output'),
        getOperation:  vi.fn().mockResolvedValue(null),
        getOperations: vi.fn().mockResolvedValue([]),
        ...overrides,
    } as unknown as BackrestAPIClient;
}
