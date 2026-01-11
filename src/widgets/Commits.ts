import { execSync } from "node:child_process";

import type { RenderContext } from "../types/RenderContext";
import type { Settings } from "../types/Settings";
import type { Widget, WidgetEditorDisplay, WidgetItem } from "../types/Widget";

// Cache for commit count
let commitsCache: { count: number | null; timestamp: number } | null = null;
const CACHE_DURATION_MS = 30_000; // 30 seconds

export class CommitsWidget implements Widget {
  getDefaultColor(): string {
    return "green";
  }

  getDescription(): string {
    return "Shows count of commits made today";
  }

  getDisplayName(): string {
    return "Commits Today";
  }

  getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
    return { displayText: this.getDisplayName() };
  }

  render(
    item: WidgetItem,
    context: RenderContext,
    settings: Settings,
  ): string | null {
    if (context.isPreview) {
      return item.rawValue ? "5" : "Commits: 5";
    }

    const count = this.getCommitCount();
    if (count === null) {
      return null; // Not in a git repo
    }

    const formatted = count.toString();
    return item.rawValue ? formatted : `Commits: ${formatted}`;
  }

  private getCommitCount(): number | null {
    // Check cache
    if (
      commitsCache &&
      Date.now() - commitsCache.timestamp < CACHE_DURATION_MS
    ) {
      return commitsCache.count;
    }

    try {
      // Get commits since midnight in local timezone
      const output = execSync(
        'git log --oneline --since="midnight" 2>/dev/null | wc -l',
        {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
          timeout: 5000,
        },
      );

      const count = parseInt(output.trim(), 10);
      commitsCache = { count: isNaN(count) ? 0 : count, timestamp: Date.now() };
      return commitsCache.count;
    } catch {
      commitsCache = { count: null, timestamp: Date.now() };
      return null;
    }
  }

  supportsRawValue(): boolean {
    return true;
  }

  supportsColors(item: WidgetItem): boolean {
    return true;
  }
}
