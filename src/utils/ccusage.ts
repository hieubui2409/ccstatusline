import { execSync } from "node:child_process";

import type {
  ActiveBlockData,
  BlocksReport,
  CostAggregates,
  DailyReport,
} from "../types/CcusageData";

// Cache state
let dailyCache: { data: DailyReport | null; timestamp: number } | null = null;
let blockCache: { data: ActiveBlockData | null; timestamp: number } | null =
  null;
const CACHE_DURATION_MS = 30_000; // 30 seconds

let ccusageAvailable: boolean | null = null;

export function isCcusageAvailable(): boolean {
  if (ccusageAvailable !== null) return ccusageAvailable;

  try {
    execSync("which ccusage", { encoding: "utf-8", stdio: "pipe" });
    ccusageAvailable = true;
  } catch {
    // Try npx/bunx fallback check
    try {
      execSync("npx ccusage --version", {
        encoding: "utf-8",
        stdio: "pipe",
        timeout: 5000,
      });
      ccusageAvailable = true;
    } catch {
      ccusageAvailable = false;
    }
  }

  return ccusageAvailable;
}

function runCcusage(args: string): string | null {
  if (!isCcusageAvailable()) return null;

  try {
    // Try direct ccusage first, then npx
    try {
      return execSync(`ccusage ${args}`, {
        encoding: "utf-8",
        stdio: "pipe",
        timeout: 10_000,
      });
    } catch {
      return execSync(`npx ccusage ${args}`, {
        encoding: "utf-8",
        stdio: "pipe",
        timeout: 15_000,
      });
    }
  } catch {
    return null;
  }
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION_MS;
}

export function getDailyReport(): DailyReport | null {
  if (dailyCache && isCacheValid(dailyCache.timestamp)) {
    return dailyCache.data;
  }

  const output = runCcusage(
    "daily --json --since $(date -d '30 days ago' +%Y%m%d)",
  );
  if (!output) {
    dailyCache = { data: null, timestamp: Date.now() };
    return null;
  }

  try {
    const data = JSON.parse(output) as DailyReport;
    dailyCache = { data, timestamp: Date.now() };
    return data;
  } catch {
    dailyCache = { data: null, timestamp: Date.now() };
    return null;
  }
}

export function getCostAggregates(): CostAggregates | null {
  const report = getDailyReport();
  if (!report?.daily) return null;

  const today = new Date().toISOString().split("T")[0];
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

  const output = runCcusage("blocks --active --json");
  if (!output) {
    blockCache = { data: null, timestamp: Date.now() };
    return null;
  }

  try {
    const data = JSON.parse(output) as BlocksReport;
    const activeBlock = data.blocks.find((b) => b.isActive);

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
      totalTokens: activeBlock.totalTokens,
    };

    blockCache = { data: blockData, timestamp: Date.now() };
    return blockData;
  } catch {
    blockCache = { data: null, timestamp: Date.now() };
    return null;
  }
}

export function clearCache(): void {
  dailyCache = null;
  blockCache = null;
  ccusageAvailable = null;
}
