import { spawn } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type {
    ActiveBlockData,
    CostAggregates,
    DailyReport
} from '../types/CcusageData';

// Disk cache for persistence across invocations
const CACHE_DIR = join(homedir(), '.cache', 'ccstatusline');
const DAILY_CACHE_FILE = join(CACHE_DIR, 'ccusage-daily.json');
const BLOCK_CACHE_FILE = join(CACHE_DIR, 'ccusage-block.json');
const CACHE_TTL_MS = 120_000; // 2 min

// Track if background fetch is already running (via lock file)
const FETCH_LOCK_FILE = join(CACHE_DIR, 'fetch.lock');
const LOCK_TTL_MS = 60_000; // 1 min max lock duration

interface DiskCache<T> {
    data: T | null;
    timestamp: number;
}

function ensureCacheDir(): void {
    if (!existsSync(CACHE_DIR)) {
        mkdirSync(CACHE_DIR, { recursive: true });
    }
}

function readDiskCache<T>(filePath: string): DiskCache<T> | null {
    try {
        if (!existsSync(filePath))
            return null;
        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as DiskCache<T>;
    } catch {
        return null;
    }
}

function isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_TTL_MS;
}

function isLockValid(): boolean {
    try {
        if (!existsSync(FETCH_LOCK_FILE))
            return false;
        const content = readFileSync(FETCH_LOCK_FILE, 'utf-8');
        const timestamp = parseInt(content, 10);
        return Date.now() - timestamp < LOCK_TTL_MS;
    } catch {
        return false;
    }
}

function acquireLock(): boolean {
    if (isLockValid())
        return false;
    ensureCacheDir();
    writeFileSync(FETCH_LOCK_FILE, Date.now().toString(), 'utf-8');
    return true;
}

function spawnBackgroundFetcher(): void {
    if (!acquireLock())
        return;

    // Inline script to fetch and cache ccusage data
    const script = `
    const { execSync } = require('child_process');
    const { writeFileSync, unlinkSync } = require('fs');
    const { join } = require('path');
    const { homedir } = require('os');

    const CACHE_DIR = join(homedir(), '.cache', 'ccstatusline');
    const DAILY_FILE = join(CACHE_DIR, 'ccusage-daily.json');
    const BLOCK_FILE = join(CACHE_DIR, 'ccusage-block.json');
    const LOCK_FILE = join(CACHE_DIR, 'fetch.lock');

    function writeCache(file, data) {
      writeFileSync(file, JSON.stringify({ data, timestamp: Date.now() }), 'utf-8');
    }

    try {
      // Fetch daily report (no timeout - let it complete)
      const dailyOutput = execSync(
        "ccusage daily --json --since $(date -d '30 days ago' +%Y%m%d)",
        { encoding: 'utf-8', stdio: 'pipe', timeout: 120000 }
      );
      const dailyData = JSON.parse(dailyOutput);
      writeCache(DAILY_FILE, dailyData);
    } catch {}

    try {
      // Fetch block data
      const blockOutput = execSync(
        'ccusage blocks --active --json',
        { encoding: 'utf-8', stdio: 'pipe', timeout: 120000 }
      );
      const blockData = JSON.parse(blockOutput);
      const active = blockData.blocks?.find(b => b.isActive);
      if (active) {
        writeCache(BLOCK_FILE, {
          costUSD: active.costUSD,
          burnRate: active.burnRate,
          projection: active.projection,
          startTime: active.startTime,
          endTime: active.endTime,
          totalTokens: active.totalTokens
        });
      } else {
        writeCache(BLOCK_FILE, null);
      }
    } catch {}

    // Release lock
    try { unlinkSync(LOCK_FILE); } catch {}
  `;

    const child = spawn('node', ['-e', script], {
        detached: true,
        stdio: 'ignore'
    });
    child.unref();
}

export function getDailyReport(): DailyReport | null {
    const cache = readDiskCache<DailyReport>(DAILY_CACHE_FILE);

    if (cache && isCacheValid(cache.timestamp)) {
        return cache.data;
    }

    // Cache expired or missing - trigger background fetch
    spawnBackgroundFetcher();

    // Return stale data if available
    return cache?.data ?? null;
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
    const cache = readDiskCache<ActiveBlockData>(BLOCK_CACHE_FILE);

    if (cache && isCacheValid(cache.timestamp)) {
        return cache.data;
    }

    // Cache expired or missing - trigger background fetch
    spawnBackgroundFetcher();

    // Return stale data if available
    return cache?.data ?? null;
}

export function clearCache(): void {
    try {
        if (existsSync(DAILY_CACHE_FILE)) {
            writeFileSync(DAILY_CACHE_FILE, '', 'utf-8');
        }
        if (existsSync(BLOCK_CACHE_FILE)) {
            writeFileSync(BLOCK_CACHE_FILE, '', 'utf-8');
        }
    } catch {
    // Ignore errors
    }
}

// Legacy export for backward compatibility
export function isCcusageAvailable(): boolean {
    return true;
}