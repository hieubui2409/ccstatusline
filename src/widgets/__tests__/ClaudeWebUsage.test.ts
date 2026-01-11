import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RenderContext, WidgetItem } from "../../types";
import type { ClaudeWebUsageResponse } from "../../types/ClaudeWebApi";
import { DEFAULT_SETTINGS } from "../../types/Settings";
import {
  getClaudeWebUsageSync,
  getTimeUntilReset,
  isClaudeWebAvailable,
  isSessionExpired,
} from "../../utils/claude-web-api";
import { ClaudeWebUsageWidget } from "../ClaudeWebUsage";

vi.mock("../../utils/claude-web-api", () => ({
  isClaudeWebAvailable: vi.fn(),
  isSessionExpired: vi.fn(),
  getClaudeWebUsageSync: vi.fn(),
  getTimeUntilReset: vi.fn(),
}));

const mockedIsClaudeWebAvailable = isClaudeWebAvailable as ReturnType<
  typeof vi.fn
>;
const mockedIsSessionExpired = isSessionExpired as ReturnType<typeof vi.fn>;
const mockedGetClaudeWebUsageSync = getClaudeWebUsageSync as ReturnType<
  typeof vi.fn
>;
const mockedGetTimeUntilReset = getTimeUntilReset as ReturnType<typeof vi.fn>;

function createUsageResponse(utilization: number): ClaudeWebUsageResponse {
  return {
    five_hour: { utilization, resets_at: "2026-01-11T15:00:00Z" },
    seven_day: null,
    seven_day_opus: null,
    seven_day_sonnet: null,
    seven_day_oauth_apps: null,
    iguana_necktie: null,
    extra_usage: null,
  };
}

describe("ClaudeWebUsageWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Preview mode", () => {
    it("should render preview with percentage mode (default)", () => {
      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: 51%");
    });

    it("should render preview with time mode", () => {
      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
        metadata: { display: "time" },
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: 2h30m");
    });

    it("should render preview with progress bar mode", () => {
      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
        metadata: { display: "progress" },
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: [████████████████░░░░░░░░░░░░░░░░] 51%");
    });

    it("should render preview with progress-short mode", () => {
      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
        metadata: { display: "progress-short" },
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: [████████░░░░░░░░] 51%");
    });

    it("should render preview with raw value", () => {
      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: true,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("51%");
    });

    it("should render preview time mode with raw value", () => {
      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: true,
        metadata: { display: "time" },
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("2h30m");
    });
  });

  describe("Availability checks", () => {
    it("should return N/A when Claude web is not available", () => {
      mockedIsClaudeWebAvailable.mockReturnValue(false);

      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: N/A");
    });

    it("should return Expired when session is expired", () => {
      mockedIsClaudeWebAvailable.mockReturnValue(true);
      mockedIsSessionExpired.mockReturnValue(true);

      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: Expired");
    });
  });

  describe("Live data rendering", () => {
    it("should render percentage mode", () => {
      mockedIsClaudeWebAvailable.mockReturnValue(true);
      mockedIsSessionExpired.mockReturnValue(false);
      mockedGetClaudeWebUsageSync.mockReturnValue(createUsageResponse(75));
      mockedGetTimeUntilReset.mockReturnValue("2h30m");

      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: 75%");
    });

    it("should render time mode", () => {
      mockedIsClaudeWebAvailable.mockReturnValue(true);
      mockedIsSessionExpired.mockReturnValue(false);
      mockedGetClaudeWebUsageSync.mockReturnValue(createUsageResponse(75));
      mockedGetTimeUntilReset.mockReturnValue("2h30m");

      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
        metadata: { display: "time" },
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: 2h30m");
    });

    it("should render time mode with -- when no reset time", () => {
      mockedIsClaudeWebAvailable.mockReturnValue(true);
      mockedIsSessionExpired.mockReturnValue(false);
      mockedGetClaudeWebUsageSync.mockReturnValue(createUsageResponse(75));
      mockedGetTimeUntilReset.mockReturnValue(null);

      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
        metadata: { display: "time" },
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: --");
    });

    it("should render progress bar mode", () => {
      mockedIsClaudeWebAvailable.mockReturnValue(true);
      mockedIsSessionExpired.mockReturnValue(false);
      mockedGetClaudeWebUsageSync.mockReturnValue(createUsageResponse(75));
      mockedGetTimeUntilReset.mockReturnValue("2h30m");

      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
        metadata: { display: "progress" },
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: [████████████████████████░░░░░░░░] 75%");
    });
  });

  describe("No cached data", () => {
    it("should return -- when no cached data", () => {
      mockedIsClaudeWebAvailable.mockReturnValue(true);
      mockedIsSessionExpired.mockReturnValue(false);
      mockedGetClaudeWebUsageSync.mockReturnValue(null);

      const widget = new ClaudeWebUsageWidget();
      const context: RenderContext = {};
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Web: --");
    });
  });

  describe("Editor actions", () => {
    it("should toggle from percentage to time mode", () => {
      const widget = new ClaudeWebUsageWidget();
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
      };

      const result = widget.handleEditorAction("toggle-mode", item);

      expect(result?.metadata?.display).toBe("time");
    });

    it("should toggle from time to progress mode", () => {
      const widget = new ClaudeWebUsageWidget();
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        metadata: { display: "time" },
      };

      const result = widget.handleEditorAction("toggle-mode", item);

      expect(result?.metadata?.display).toBe("progress");
    });

    it("should toggle from progress to progress-short mode", () => {
      const widget = new ClaudeWebUsageWidget();
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        metadata: { display: "progress" },
      };

      const result = widget.handleEditorAction("toggle-mode", item);

      expect(result?.metadata?.display).toBe("progress-short");
    });

    it("should toggle from progress-short to percentage mode", () => {
      const widget = new ClaudeWebUsageWidget();
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        metadata: { display: "progress-short" },
      };

      const result = widget.handleEditorAction("toggle-mode", item);

      expect(result?.metadata?.display).toBe("percentage");
    });
  });

  describe("Metadata", () => {
    it("should have correct display name", () => {
      const widget = new ClaudeWebUsageWidget();

      expect(widget.getDisplayName()).toBe("Claude.ai Usage");
    });

    it("should have mode toggle keybind", () => {
      const widget = new ClaudeWebUsageWidget();
      const keybinds = widget.getCustomKeybinds();

      expect(keybinds).toHaveLength(1);
      expect(keybinds[0]?.key).toBe("o");
      expect(keybinds[0]?.action).toBe("toggle-mode");
    });

    it("should show mode in editor display", () => {
      const widget = new ClaudeWebUsageWidget();
      const item: WidgetItem = {
        id: "claude-web-usage",
        type: "claude-web-usage",
        metadata: { display: "progress" },
      };

      const display = widget.getEditorDisplay(item);

      expect(display.modifierText).toBe("(progress bar)");
    });
  });
});
