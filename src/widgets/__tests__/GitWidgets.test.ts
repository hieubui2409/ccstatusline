import { describe, expect, it, vi } from "vitest";

import type { RenderContext, WidgetItem } from "../../types";
import { DEFAULT_SETTINGS } from "../../types/Settings";
import { CommitsWidget } from "../Commits";
import { SubmodulesWidget } from "../Submodules";

// Mock execSync - but because widgets have module-level caches,
// we test primarily preview mode and error handling
vi.mock("node:child_process", () => ({ execSync: vi.fn() }));

describe("Git Widgets", () => {
  describe("CommitsWidget", () => {
    it("should render preview mode", () => {
      const widget = new CommitsWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "commits",
        type: "commits",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Commits: 5");
    });

    it("should render preview mode with raw value", () => {
      const widget = new CommitsWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "commits",
        type: "commits",
        rawValue: true,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("5");
    });

    it("should have correct metadata and support colors", () => {
      const widget = new CommitsWidget();
      const item: WidgetItem = { id: "commits", type: "commits" };

      expect(widget.getDisplayName()).toBe("Commits Today");
      expect(widget.getDescription()).toContain("commits");
      expect(widget.supportsRawValue()).toBe(true);
      expect(widget.supportsColors(item)).toBe(true);
      expect(widget.getDefaultColor()).toBe("green");
    });
  });

  describe("SubmodulesWidget", () => {
    it("should render preview mode", () => {
      const widget = new SubmodulesWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "submodules",
        type: "submodules",
        rawValue: false,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("Submodules: 3");
    });

    it("should render preview mode with raw value", () => {
      const widget = new SubmodulesWidget();
      const context: RenderContext = { isPreview: true };
      const item: WidgetItem = {
        id: "submodules",
        type: "submodules",
        rawValue: true,
      };

      const result = widget.render(item, context, DEFAULT_SETTINGS);

      expect(result).toBe("3");
    });

    it("should have correct metadata and support colors", () => {
      const widget = new SubmodulesWidget();
      const item: WidgetItem = { id: "submodules", type: "submodules" };

      expect(widget.getDisplayName()).toBe("Submodules");
      expect(widget.getDescription()).toContain("submodules");
      expect(widget.supportsRawValue()).toBe(true);
      expect(widget.supportsColors(item)).toBe(true);
      expect(widget.getDefaultColor()).toBe("blue");
    });
  });
});
