import { execSync } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearCache,
  getActiveBlock,
  getCostAggregates,
  getDailyReport,
  isCcusageAvailable,
} from "../ccusage";

vi.mock("node:child_process", () => ({ execSync: vi.fn() }));

const mockedExecSync = execSync as ReturnType<typeof vi.fn>;

describe("ccusage utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
  });

  describe("isCcusageAvailable()", () => {
    it("should return true when ccusage is available via which", () => {
      mockedExecSync.mockReturnValueOnce("");
      const result = isCcusageAvailable();
      expect(result).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith(
        "which ccusage",
        expect.any(Object),
      );
    });

    it("should fallback to npx when direct ccusage not found", () => {
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error("not found");
        })
        .mockReturnValueOnce("ccusage 1.0.0");

      const result = isCcusageAvailable();
      expect(result).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledTimes(2);
    });

    it("should return false when neither ccusage nor npx work", () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error("not found");
      });

      const result = isCcusageAvailable();
      expect(result).toBe(false);
    });

    it("should cache the availability result", () => {
      mockedExecSync.mockReturnValueOnce("");
      isCcusageAvailable();
      mockedExecSync.mockClear();

      const result = isCcusageAvailable();
      expect(result).toBe(true);
      expect(mockedExecSync).not.toHaveBeenCalled(); // Should use cache
    });
  });

  describe("getDailyReport()", () => {
    it("should return parsed daily report when ccusage outputs valid JSON", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable check
      const dailyData = {
        daily: [
          {
            date: "2026-01-11",
            inputTokens: 1000,
            outputTokens: 500,
            cacheCreationTokens: 100,
            cacheReadTokens: 50,
            totalTokens: 1650,
            totalCost: 5.5,
            modelsUsed: ["claude-3-5-sonnet"],
          },
        ],
        totals: {
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1650,
          totalCost: 5.5,
        },
      };

      mockedExecSync.mockReturnValueOnce(JSON.stringify(dailyData));

      const result = getDailyReport();
      expect(result).toEqual(dailyData);
    });

    it("should return null when ccusage is not available", () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error("not available");
      });

      const result = getDailyReport();
      expect(result).toBeNull();
    });

    it("should return null when JSON parse fails", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable check
      mockedExecSync.mockReturnValueOnce("invalid json {");

      const result = getDailyReport();
      expect(result).toBeNull();
    });

    it("should cache the result for 30 seconds", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable check
      const dailyData = {
        daily: [],
        totals: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          totalCost: 0,
        },
      };

      mockedExecSync.mockReturnValueOnce(JSON.stringify(dailyData));
      getDailyReport();

      mockedExecSync.mockClear();
      const cached = getDailyReport();

      expect(cached).toEqual(dailyData);
      expect(mockedExecSync).not.toHaveBeenCalled(); // Should use cache
    });

    it("should refetch after cache expires", () => {
      vi.useFakeTimers();

      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable check
      mockedExecSync.mockReturnValueOnce(
        JSON.stringify({ daily: [], totals: {} }),
      );

      getDailyReport();

      // Fast-forward time past cache duration
      vi.advanceTimersByTime(31_000); // 31 seconds

      mockedExecSync.mockReturnValueOnce(
        JSON.stringify({ daily: [], totals: {} }),
      );
      getDailyReport();

      vi.useRealTimers();

      // Should have called execSync again for the new fetch
      expect(mockedExecSync.mock.calls.length).toBeGreaterThan(2);
    });
  });

  describe("getCostAggregates()", () => {
    it("should return daily, weekly, and monthly totals", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const dailyData = {
        daily: [
          { date: yesterday, totalCost: 10.0 },
          { date: today, totalCost: 5.5 },
        ],
        totals: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          totalCost: 15.5,
        },
      };

      mockedExecSync.mockReturnValueOnce(JSON.stringify(dailyData));

      const aggregates = getCostAggregates();

      expect(aggregates).toEqual({
        daily: 5.5,
        weekly: expect.any(Number) as unknown,
        monthly: 15.5,
      });
    });

    it("should return null when getDailyReport returns null", () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error("not available");
      });

      const aggregates = getCostAggregates();
      expect(aggregates).toBeNull();
    });

    it("should return null when daily array is missing", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable
      mockedExecSync.mockReturnValueOnce(
        JSON.stringify({
          totals: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            totalCost: 0,
          },
        }),
      );

      const aggregates = getCostAggregates();
      expect(aggregates).toBeNull();
    });

    it("should correctly calculate 7-day window", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable
      const now = Date.now();
      const dates = [];

      for (let i = 0; i < 14; i++) {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        dates.push(d.toISOString().split("T")[0]);
      }

      const dailyData = {
        daily: dates.map((date, i) => ({
          date,
          totalCost: i < 7 ? 10 : 5, // Last 7 days: $10, older: $5
        })),
        totals: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          totalCost: 0,
        },
      };

      mockedExecSync.mockReturnValueOnce(JSON.stringify(dailyData));

      const aggregates = getCostAggregates();
      expect(aggregates?.weekly).toBe(70); // 7 days * $10
    });
  });

  describe("getActiveBlock()", () => {
    it("should return active block data when available", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable check
      const blockData = {
        blocks: [
          {
            id: "block-1",
            startTime: "2026-01-11T10:00:00Z",
            endTime: "2026-01-11T11:00:00Z",
            actualEndTime: null,
            isActive: true,
            isGap: false,
            entries: 5,
            tokenCounts: {
              inputTokens: 1000,
              outputTokens: 500,
              cacheCreationInputTokens: 100,
              cacheReadInputTokens: 50,
            },
            totalTokens: 1650,
            costUSD: 12.5,
            models: ["claude-3-5-sonnet"],
            burnRate: 1200,
            projection: {
              projectedCostUSD: 45.0,
              projectedTokens: 5000,
              projectedEndTime: "2026-01-11T12:00:00Z",
              burnRate: 1200,
            },
          },
        ],
      };

      mockedExecSync.mockReturnValueOnce(JSON.stringify(blockData));

      const block = getActiveBlock();
      expect(block).toBeDefined();
      expect(block?.costUSD).toBe(12.5);
      expect(block?.burnRate).toBe(1200);
      expect(block?.projection?.projectedCostUSD).toBe(45.0);
    });

    it("should return null when no active block exists", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable check
      const blockData = {
        blocks: [
          {
            id: "block-1",
            isActive: false,
            costUSD: 12.5,
            burnRate: null,
            projection: null,
            startTime: "2026-01-11T10:00:00Z",
            endTime: "2026-01-11T11:00:00Z",
          },
        ],
      };

      mockedExecSync.mockReturnValueOnce(JSON.stringify(blockData));

      const block = getActiveBlock();
      expect(block).toBeNull();
    });

    it("should return null when ccusage is not available", () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error("not available");
      });

      const block = getActiveBlock();
      expect(block).toBeNull();
    });

    it("should return null when JSON parse fails", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable check
      mockedExecSync.mockReturnValueOnce("invalid json");

      const block = getActiveBlock();
      expect(block).toBeNull();
    });

    it("should cache the result for 30 seconds", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable check
      const blockData = {
        blocks: [
          {
            id: "block-1",
            isActive: true,
            costUSD: 12.5,
            burnRate: 1200,
            projection: null,
            startTime: "2026-01-11T10:00:00Z",
            endTime: "2026-01-11T11:00:00Z",
            totalTokens: 1650,
          },
        ],
      };

      mockedExecSync.mockReturnValueOnce(JSON.stringify(blockData));
      getActiveBlock();

      mockedExecSync.mockClear();
      const cached = getActiveBlock();

      expect(cached?.costUSD).toBe(12.5);
      expect(mockedExecSync).not.toHaveBeenCalled(); // Should use cache
    });

    it("should handle blocks with null projection", () => {
      clearCache(); // Clear any cached data from previous tests
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable check
      const blockData = {
        blocks: [
          {
            id: "block-1",
            isActive: true,
            costUSD: 5.0,
            burnRate: 500,
            projection: null,
            startTime: "2026-01-11T10:00:00Z",
            endTime: "2026-01-11T11:00:00Z",
            totalTokens: 1000,
          },
        ],
      };

      mockedExecSync.mockReturnValueOnce(JSON.stringify(blockData));

      const block = getActiveBlock();
      expect(block).toBeDefined();
      expect(block?.projection).toBeNull();
      expect(block?.costUSD).toBe(5.0);
    });
  });

  describe("clearCache()", () => {
    it("should clear cached daily report", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable
      mockedExecSync.mockReturnValueOnce(
        JSON.stringify({ daily: [], totals: {} }),
      );

      getDailyReport();
      clearCache();
      mockedExecSync.mockClear();

      // After clearCache(), ccusageAvailable is null again, so need mock for "which ccusage"
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable re-check
      mockedExecSync.mockReturnValueOnce(
        JSON.stringify({
          daily: [{ date: "2026-01-11", totalCost: 10 }],
          totals: {},
        }),
      );
      const result = getDailyReport();

      expect(mockedExecSync).toHaveBeenCalled(); // Should fetch again, not use cache
      expect(result).not.toBeNull();
      if (result?.daily[0]) {
        expect(result.daily[0].totalCost).toBe(10);
      }
    });

    it("should clear cached active block", () => {
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable
      mockedExecSync.mockReturnValueOnce(JSON.stringify({ blocks: [] }));

      getActiveBlock();
      clearCache();
      mockedExecSync.mockClear();

      // After clearCache(), ccusageAvailable is null again
      mockedExecSync.mockReturnValueOnce(""); // isCcusageAvailable re-check
      mockedExecSync.mockReturnValueOnce(JSON.stringify({ blocks: [] }));
      getActiveBlock();

      expect(mockedExecSync).toHaveBeenCalled(); // Should fetch again
    });
  });
});
