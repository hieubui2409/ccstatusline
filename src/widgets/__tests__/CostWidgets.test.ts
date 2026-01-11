import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RenderContext, WidgetItem } from "../../types";
import { DEFAULT_SETTINGS } from "../../types/Settings";
import { getCostAggregates, isCcusageAvailable } from "../../utils/ccusage";
import { CostDailyWidget } from "../CostDaily";
import { CostMonthlyWidget } from "../CostMonthly";
import { CostWeeklyWidget } from "../CostWeekly";

vi.mock("../../utils/ccusage", () => ({
  isCcusageAvailable: vi.fn(),
  getCostAggregates: vi.fn(),
}));

const mockedIsCcusageAvailable = isCcusageAvailable as ReturnType<typeof vi.fn>;
const mockedGetCostAggregates = getCostAggregates as ReturnType<typeof vi.fn>;

describe("Cost Widgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CostDailyWidget", () => {
    it("should render preview mode with formatted cost", () => {
      const widget = new CostDailyWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "cost-daily",
        type: "cost-daily",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Today: $12.34");
    });

    it("should render preview mode with raw value", () => {
      const widget = new CostDailyWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "cost-daily",
        type: "cost-daily",
        rawValue: true,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("$12.34");
    });

    it("should return N/A when ccusage is not available", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(false);
      const widget = new CostDailyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-daily",
        type: "cost-daily",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Today: N/A");
    });

    it("should return N/A (raw) when ccusage is not available", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(false);
      const widget = new CostDailyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-daily",
        type: "cost-daily",
        rawValue: true,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("N/A");
    });

    it("should format daily cost correctly with 2 decimal places", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(true);
      mockedGetCostAggregates.mockReturnValueOnce({
        daily: 42.5678,
        weekly: 100,
        monthly: 200,
      });

      const widget = new CostDailyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-daily",
        type: "cost-daily",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Today: $42.57");
    });

    it("should return N/A when getCostAggregates returns null", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(true);
      mockedGetCostAggregates.mockReturnValueOnce(null);

      const widget = new CostDailyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-daily",
        type: "cost-daily",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Today: N/A");
    });

    it("should support raw value output", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(true);
      mockedGetCostAggregates.mockReturnValueOnce({
        daily: 12.34,
        weekly: 100,
        monthly: 200,
      });

      const widget = new CostDailyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-daily",
        type: "cost-daily",
        rawValue: true,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("$12.34");
    });

    it("should support color customization", () => {
      const widget = new CostDailyWidget();
      const item: WidgetItem = { id: "cost-daily", type: "cost-daily" };

      expect(widget.supportsColors(item)).toBe(true);
      expect(widget.getDefaultColor()).toBe("green");
    });

    it("should have correct display name", () => {
      const widget = new CostDailyWidget();

      expect(widget.getDisplayName()).toBe("Cost (Daily)");
      expect(widget.getDescription()).toContain("today");
    });
  });

  describe("CostWeeklyWidget", () => {
    it("should render preview mode with formatted cost", () => {
      const widget = new CostWeeklyWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "cost-weekly",
        type: "cost-weekly",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Week: $89.50");
    });

    it("should render preview mode with raw value", () => {
      const widget = new CostWeeklyWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "cost-weekly",
        type: "cost-weekly",
        rawValue: true,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("$89.50");
    });

    it("should return N/A when ccusage is not available", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(false);
      const widget = new CostWeeklyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-weekly",
        type: "cost-weekly",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Week: N/A");
    });

    it("should format weekly cost correctly", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(true);
      mockedGetCostAggregates.mockReturnValueOnce({
        daily: 12.34,
        weekly: 87.654,
        monthly: 200,
      });

      const widget = new CostWeeklyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-weekly",
        type: "cost-weekly",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Week: $87.65");
    });

    it("should return N/A when getCostAggregates returns null", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(true);
      mockedGetCostAggregates.mockReturnValueOnce(null);

      const widget = new CostWeeklyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-weekly",
        type: "cost-weekly",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Week: N/A");
    });

    it("should support raw value output", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(true);
      mockedGetCostAggregates.mockReturnValueOnce({
        daily: 12.34,
        weekly: 89.5,
        monthly: 200,
      });

      const widget = new CostWeeklyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-weekly",
        type: "cost-weekly",
        rawValue: true,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("$89.50");
    });

    it("should have correct display name", () => {
      const widget = new CostWeeklyWidget();

      expect(widget.getDisplayName()).toBe("Cost (Weekly)");
      expect(widget.getDescription()).toContain("7 days");
    });
  });

  describe("CostMonthlyWidget", () => {
    it("should render preview mode with formatted cost", () => {
      const widget = new CostMonthlyWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "cost-monthly",
        type: "cost-monthly",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Month: $245.00");
    });

    it("should render preview mode with raw value", () => {
      const widget = new CostMonthlyWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "cost-monthly",
        type: "cost-monthly",
        rawValue: true,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("$245.00");
    });

    it("should return N/A when ccusage is not available", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(false);
      const widget = new CostMonthlyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-monthly",
        type: "cost-monthly",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Month: N/A");
    });

    it("should format monthly cost correctly", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(true);
      mockedGetCostAggregates.mockReturnValueOnce({
        daily: 12.34,
        weekly: 89.5,
        monthly: 234.5678,
      });

      const widget = new CostMonthlyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-monthly",
        type: "cost-monthly",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Month: $234.57");
    });

    it("should return N/A when getCostAggregates returns null", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(true);
      mockedGetCostAggregates.mockReturnValueOnce(null);

      const widget = new CostMonthlyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-monthly",
        type: "cost-monthly",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Month: N/A");
    });

    it("should support raw value output", () => {
      mockedIsCcusageAvailable.mockReturnValueOnce(true);
      mockedGetCostAggregates.mockReturnValueOnce({
        daily: 12.34,
        weekly: 89.5,
        monthly: 245.0,
      });

      const widget = new CostMonthlyWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "cost-monthly",
        type: "cost-monthly",
        rawValue: true,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("$245.00");
    });

    it("should have correct display name", () => {
      const widget = new CostMonthlyWidget();

      expect(widget.getDisplayName()).toBe("Cost (Monthly)");
      expect(widget.getDescription()).toContain("30 days");
    });
  });
});
