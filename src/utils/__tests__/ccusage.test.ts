import { execSync } from 'node:child_process';
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

vi.mock('node:child_process', () => ({ execSync: vi.fn() }));

const mockedExecSync = execSync as ReturnType<typeof vi.fn>;

describe('ccusage utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCache();
    });

    describe('isCcusageAvailable()', () => {
        it('should always return true (legacy behavior)', () => {
            const result = isCcusageAvailable();
            expect(result).toBe(true);
            expect(mockedExecSync).not.toHaveBeenCalled();
        });
    });

    describe('getDailyReport()', () => {
        it('should return parsed daily report when ccusage outputs valid JSON', () => {
            const dailyData = {
                daily: [
                    {
                        date: '2026-01-11',
                        inputTokens: 1000,
                        outputTokens: 500,
                        cacheCreationTokens: 100,
                        cacheReadTokens: 50,
                        totalTokens: 1650,
                        totalCost: 5.5,
                        modelsUsed: ['claude-3-5-sonnet']
                    }
                ],
                totals: {
                    inputTokens: 1000,
                    outputTokens: 500,
                    totalTokens: 1650,
                    totalCost: 5.5
                }
            };

            mockedExecSync.mockReturnValueOnce(JSON.stringify(dailyData));

            const result = getDailyReport();
            expect(result).toEqual(dailyData);
        });

        it('should return null when JSON parse fails', () => {
            mockedExecSync.mockReturnValueOnce('invalid json {');

            const result = getDailyReport();
            expect(result).toBeNull();
        });

        it('should cache success for 120 seconds', () => {
            const dailyData = {
                daily: [],
                totals: {
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0,
                    totalCost: 0
                }
            };

            mockedExecSync.mockReturnValueOnce(JSON.stringify(dailyData));
            getDailyReport();

            mockedExecSync.mockClear();
            const cached = getDailyReport();

            expect(cached).toEqual(dailyData);
            expect(mockedExecSync).not.toHaveBeenCalled();
        });

        it('should refetch after success cache expires (120s)', () => {
            vi.useFakeTimers();

            mockedExecSync.mockReturnValueOnce(
                JSON.stringify({ daily: [], totals: {} })
            );
            getDailyReport();

            vi.advanceTimersByTime(121_000);

            mockedExecSync.mockReturnValueOnce(
                JSON.stringify({ daily: [], totals: {} })
            );
            getDailyReport();

            vi.useRealTimers();

            expect(mockedExecSync.mock.calls.length).toBe(2);
        });

        it('should extend cache and return old data on failure', () => {
            const dailyData = {
                daily: [{ date: '2026-01-11', totalCost: 5.5 }],
                totals: { totalCost: 5.5 }
            };

            // First call succeeds
            mockedExecSync.mockReturnValueOnce(JSON.stringify(dailyData));
            const first = getDailyReport();
            expect(first).toEqual(dailyData);

            // Expire cache
            vi.useFakeTimers();
            vi.advanceTimersByTime(121_000);

            // Second call fails - should return old data
            mockedExecSync.mockImplementation(() => {
                throw new Error('timeout');
            });

            const second = getDailyReport();
            expect(second).toEqual(dailyData); // Returns stale data

            vi.useRealTimers();
        });

        it('should return null on first failure (no previous data)', () => {
            mockedExecSync.mockImplementation(() => {
                throw new Error('timeout');
            });

            const result = getDailyReport();
            expect(result).toBeNull();
        });
    });

    describe('getCostAggregates()', () => {
        it('should return daily, weekly, and monthly totals', () => {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];

            const dailyData = {
                daily: [
                    { date: yesterday, totalCost: 10.0 },
                    { date: today, totalCost: 5.5 }
                ],
                totals: {
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0,
                    totalCost: 15.5
                }
            };

            mockedExecSync.mockReturnValueOnce(JSON.stringify(dailyData));

            const aggregates = getCostAggregates();

            expect(aggregates).toEqual({
                daily: 5.5,
                weekly: expect.any(Number) as unknown,
                monthly: 15.5
            });
        });

        it('should return null when getDailyReport returns null', () => {
            mockedExecSync.mockImplementation(() => {
                throw new Error('timeout');
            });

            const aggregates = getCostAggregates();
            expect(aggregates).toBeNull();
        });

        it('should return null when daily array is missing', () => {
            mockedExecSync.mockReturnValueOnce(
                JSON.stringify({
                    totals: {
                        inputTokens: 0,
                        outputTokens: 0,
                        totalTokens: 0,
                        totalCost: 0
                    }
                })
            );

            const aggregates = getCostAggregates();
            expect(aggregates).toBeNull();
        });

        it('should correctly calculate 7-day window', () => {
            const now = Date.now();
            const dates = [];

            for (let i = 0; i < 14; i++) {
                const d = new Date(now - i * 24 * 60 * 60 * 1000);
                dates.push(d.toISOString().split('T')[0]);
            }

            const dailyData = {
                daily: dates.map((date, i) => ({
                    date,
                    totalCost: i < 7 ? 10 : 5
                })),
                totals: {
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0,
                    totalCost: 0
                }
            };

            mockedExecSync.mockReturnValueOnce(JSON.stringify(dailyData));

            const aggregates = getCostAggregates();
            expect(aggregates?.weekly).toBe(70);
        });
    });

    describe('getActiveBlock()', () => {
        it('should return active block data when available', () => {
            const blockData = {
                blocks: [
                    {
                        id: 'block-1',
                        startTime: '2026-01-11T10:00:00Z',
                        endTime: '2026-01-11T11:00:00Z',
                        actualEndTime: null,
                        isActive: true,
                        isGap: false,
                        entries: 5,
                        tokenCounts: {
                            inputTokens: 1000,
                            outputTokens: 500,
                            cacheCreationInputTokens: 100,
                            cacheReadInputTokens: 50
                        },
                        totalTokens: 1650,
                        costUSD: 12.5,
                        models: ['claude-3-5-sonnet'],
                        burnRate: 1200,
                        projection: {
                            projectedCostUSD: 45.0,
                            projectedTokens: 5000,
                            projectedEndTime: '2026-01-11T12:00:00Z',
                            burnRate: 1200
                        }
                    }
                ]
            };

            mockedExecSync.mockReturnValueOnce(JSON.stringify(blockData));

            const block = getActiveBlock();
            expect(block).toBeDefined();
            expect(block?.costUSD).toBe(12.5);
            expect(block?.burnRate).toBe(1200);
            expect(block?.projection?.projectedCostUSD).toBe(45.0);
        });

        it('should return null when no active block exists', () => {
            const blockData = {
                blocks: [
                    {
                        id: 'block-1',
                        isActive: false,
                        costUSD: 12.5,
                        burnRate: null,
                        projection: null,
                        startTime: '2026-01-11T10:00:00Z',
                        endTime: '2026-01-11T11:00:00Z'
                    }
                ]
            };

            mockedExecSync.mockReturnValueOnce(JSON.stringify(blockData));

            const block = getActiveBlock();
            expect(block).toBeNull();
        });

        it('should return null when ccusage command fails (fail-fast)', () => {
            mockedExecSync.mockImplementation(() => {
                throw new Error('timeout');
            });

            const block = getActiveBlock();
            expect(block).toBeNull();
        });

        it('should return null when JSON parse fails', () => {
            mockedExecSync.mockReturnValueOnce('invalid json');

            const block = getActiveBlock();
            expect(block).toBeNull();
        });

        it('should cache success for 120 seconds', () => {
            const blockData = {
                blocks: [
                    {
                        id: 'block-1',
                        isActive: true,
                        costUSD: 12.5,
                        burnRate: 1200,
                        projection: null,
                        startTime: '2026-01-11T10:00:00Z',
                        endTime: '2026-01-11T11:00:00Z',
                        totalTokens: 1650
                    }
                ]
            };

            mockedExecSync.mockReturnValueOnce(JSON.stringify(blockData));
            getActiveBlock();

            mockedExecSync.mockClear();
            const cached = getActiveBlock();

            expect(cached?.costUSD).toBe(12.5);
            expect(mockedExecSync).not.toHaveBeenCalled();
        });

        it('should handle blocks with null projection', () => {
            const blockData = {
                blocks: [
                    {
                        id: 'block-1',
                        isActive: true,
                        costUSD: 5.0,
                        burnRate: 500,
                        projection: null,
                        startTime: '2026-01-11T10:00:00Z',
                        endTime: '2026-01-11T11:00:00Z',
                        totalTokens: 1000
                    }
                ]
            };

            mockedExecSync.mockReturnValueOnce(JSON.stringify(blockData));

            const block = getActiveBlock();
            expect(block).toBeDefined();
            expect(block?.projection).toBeNull();
            expect(block?.costUSD).toBe(5.0);
        });
    });

    describe('clearCache()', () => {
        it('should clear cached daily report', () => {
            mockedExecSync.mockReturnValueOnce(
                JSON.stringify({ daily: [], totals: {} })
            );

            getDailyReport();
            clearCache();
            mockedExecSync.mockClear();

            mockedExecSync.mockReturnValueOnce(
                JSON.stringify({
                    daily: [{ date: '2026-01-11', totalCost: 10 }],
                    totals: {}
                })
            );
            const result = getDailyReport();

            expect(mockedExecSync).toHaveBeenCalled();
            expect(result).not.toBeNull();
            if (result?.daily[0]) {
                expect(result.daily[0].totalCost).toBe(10);
            }
        });

        it('should clear cached active block', () => {
            mockedExecSync.mockReturnValueOnce(JSON.stringify({ blocks: [] }));

            getActiveBlock();
            clearCache();
            mockedExecSync.mockClear();

            mockedExecSync.mockReturnValueOnce(JSON.stringify({ blocks: [] }));
            getActiveBlock();

            expect(mockedExecSync).toHaveBeenCalled();
        });
    });
});