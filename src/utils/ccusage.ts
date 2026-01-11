import { execSync } from 'node:child_process';

import type {
    ActiveBlockData,
    BlocksReport,
    CostAggregates,
    DailyReport
} from '../types/CcusageData';

// Cache with single TTL - on failure, extend existing cache
let dailyCache: { data: DailyReport | null; timestamp: number } | null = null;
let blockCache: { data: ActiveBlockData | null; timestamp: number } | null
  = null;
const CACHE_TTL_MS = 120_000; // 2 min

// Fast timeout for fail-fast behavior
const FAST_TIMEOUT_MS = 2_000;

function runCcusageFast(args: string): string | null {
    try {
        return execSync(`ccusage ${args}`, {
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: FAST_TIMEOUT_MS
        });
    } catch {
        return null;
    }
}

function isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_TTL_MS;
}

export function getDailyReport(): DailyReport | null {
    if (dailyCache && isCacheValid(dailyCache.timestamp)) {
        return dailyCache.data;
    }

    const output = runCcusageFast(
        'daily --json --since $(date -d \'30 days ago\' +%Y%m%d)'
    );

    if (!output) {
    // Failure: extend existing cache TTL, keep old data
        if (dailyCache) {
            dailyCache.timestamp = Date.now();
            return dailyCache.data;
        }
        // No previous data - cache null
        dailyCache = { data: null, timestamp: Date.now() };
        return null;
    }

    try {
        const data = JSON.parse(output) as DailyReport;
        dailyCache = { data, timestamp: Date.now() };
        return data;
    } catch {
    // Parse failure: extend existing cache
        if (dailyCache) {
            dailyCache.timestamp = Date.now();
            return dailyCache.data;
        }
        dailyCache = { data: null, timestamp: Date.now() };
        return null;
    }
}

export function getCostAggregates(): CostAggregates | null {
    const report = getDailyReport();
    if (!report?.daily)
        return null;

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let daily = 0;
    let weekly = 0;
    let monthly = 0;

    for (const entry of report.daily) {
        const entryDate = new Date(entry.date);

        if (entry.date === today) {
            daily = entry.totalCost;
        }

        if (entryDate >= sevenDaysAgo) {
            weekly += entry.totalCost;
        }

        monthly += entry.totalCost;
    }

    return { daily, weekly, monthly };
}

export function getActiveBlock(): ActiveBlockData | null {
    if (blockCache && isCacheValid(blockCache.timestamp)) {
        return blockCache.data;
    }

    const output = runCcusageFast('blocks --active --json');

    if (!output) {
    // Failure: extend existing cache TTL, keep old data
        if (blockCache) {
            blockCache.timestamp = Date.now();
            return blockCache.data;
        }
        blockCache = { data: null, timestamp: Date.now() };
        return null;
    }

    try {
        const data = JSON.parse(output) as BlocksReport;
        const activeBlock = data.blocks.find(b => b.isActive);

        if (!activeBlock) {
            blockCache = { data: null, timestamp: Date.now() };
            return null;
        }

        const blockData: ActiveBlockData = {
            costUSD: activeBlock.costUSD,
            burnRate: activeBlock.burnRate,
            projection: activeBlock.projection,
            startTime: activeBlock.startTime,
            endTime: activeBlock.endTime,
            totalTokens: activeBlock.totalTokens
        };

        blockCache = { data: blockData, timestamp: Date.now() };
        return blockData;
    } catch {
    // Parse failure: extend existing cache
        if (blockCache) {
            blockCache.timestamp = Date.now();
            return blockCache.data;
        }
        blockCache = { data: null, timestamp: Date.now() };
        return null;
    }
}

export function clearCache(): void {
    dailyCache = null;
    blockCache = null;
}

// Legacy export for backward compatibility
export function isCcusageAvailable(): boolean {
    return true;
}