import { spawn } from 'node:child_process';
import {
    existsSync,
    readFileSync,
    writeFileSync
} from 'node:fs';
import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import {
    clearCache,
    getActiveBlock,
    getCostAggregates,
    getDailyReport,
    isCcusageAvailable
} from '../ccusage';

vi.mock('node:fs', () => ({
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn()
}));

vi.mock('node:child_process', () => ({ spawn: vi.fn(() => ({ unref: vi.fn() })) }));

const mockedExistsSync = existsSync as ReturnType<typeof vi.fn>;
const mockedReadFileSync = readFileSync as ReturnType<typeof vi.fn>;
const mockedWriteFileSync = writeFileSync as ReturnType<typeof vi.fn>;
const mockedSpawn = spawn as ReturnType<typeof vi.fn>;

describe('ccusage utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedSpawn.mockReturnValue({ unref: vi.fn() });
    });

    describe('isCcusageAvailable()', () => {
        it('should always return true (legacy behavior)', () => {
            expect(isCcusageAvailable()).toBe(true);
        });
    });

    describe('getDailyReport()', () => {
        it('should return cached data when cache is valid', () => {
            const dailyData = {
                daily: [{ date: '2026-01-11', totalCost: 5.5 }],
                totals: { totalCost: 5.5 }
            };
            const cache = { data: dailyData, timestamp: Date.now() };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(cache));

            const result = getDailyReport();
            expect(result).toEqual(dailyData);
            expect(mockedSpawn).not.toHaveBeenCalled();
        });

        it('should spawn background fetcher when cache expired', () => {
            const dailyData = {
                daily: [{ date: '2026-01-11', totalCost: 5.5 }],
                totals: { totalCost: 5.5 }
            };
            const cache = { data: dailyData, timestamp: Date.now() - 130_000 };

            mockedExistsSync.mockImplementation((path: string) => {
                if (path.includes('fetch.lock'))
                    return false;
                return true;
            });
            mockedReadFileSync.mockReturnValue(JSON.stringify(cache));

            const result = getDailyReport();
            expect(result).toEqual(dailyData);
            expect(mockedSpawn).toHaveBeenCalled();
        });

        it('should return null when no cache exists', () => {
            mockedExistsSync.mockReturnValue(false);

            const result = getDailyReport();
            expect(result).toBeNull();
            expect(mockedSpawn).toHaveBeenCalled();
        });

        it('should not spawn multiple fetchers when lock is active', () => {
            mockedExistsSync.mockImplementation((path: string) => {
                if (path.includes('fetch.lock'))
                    return true;
                return false;
            });
            mockedReadFileSync.mockReturnValue(Date.now().toString());

            getDailyReport();
            getDailyReport();

            expect(mockedSpawn).not.toHaveBeenCalled();
        });
    });

    describe('getCostAggregates()', () => {
        it('should return aggregates from cached daily report', () => {
            const today = new Date().toISOString().split('T')[0];
            const dailyData = {
                daily: [{ date: today, totalCost: 5.5 }],
                totals: { totalCost: 5.5 }
            };
            const cache = { data: dailyData, timestamp: Date.now() };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(cache));

            const aggregates = getCostAggregates();
            expect(aggregates?.daily).toBe(5.5);
        });

        it('should return null when no daily report available', () => {
            mockedExistsSync.mockReturnValue(false);

            const aggregates = getCostAggregates();
            expect(aggregates).toBeNull();
        });
    });

    describe('getActiveBlock()', () => {
        it('should return cached block data when valid', () => {
            const blockData = {
                costUSD: 12.5,
                burnRate: 1200,
                projection: null,
                startTime: '2026-01-11T10:00:00Z',
                endTime: '2026-01-11T11:00:00Z',
                totalTokens: 1650
            };
            const cache = { data: blockData, timestamp: Date.now() };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(cache));

            const result = getActiveBlock();
            expect(result?.costUSD).toBe(12.5);
        });

        it('should spawn background fetcher when cache expired', () => {
            const blockData = { costUSD: 12.5 };
            const cache = { data: blockData, timestamp: Date.now() - 130_000 };

            mockedExistsSync.mockImplementation((path: string) => {
                if (path.includes('fetch.lock'))
                    return false;
                return true;
            });
            mockedReadFileSync.mockReturnValue(JSON.stringify(cache));

            const result = getActiveBlock();
            expect(result?.costUSD).toBe(12.5);
            expect(mockedSpawn).toHaveBeenCalled();
        });
    });

    describe('clearCache()', () => {
        it('should clear cache files', () => {
            mockedExistsSync.mockReturnValue(true);

            clearCache();

            expect(mockedWriteFileSync).toHaveBeenCalledTimes(2);
        });
    });
});