import type { RenderContext } from "../types/RenderContext";
import type { Settings } from "../types/Settings";
import type { Widget, WidgetEditorDisplay, WidgetItem } from "../types/Widget";
import { getCostAggregates, isCcusageAvailable } from "../utils/ccusage";

export class CostDailyWidget implements Widget {
  getDefaultColor(): string {
    return "green";
  }

  getDescription(): string {
    return "Shows today's total cost from ccusage";
  }

  getDisplayName(): string {
    return "Cost (Daily)";
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
      return item.rawValue ? "$12.34" : "Today: $12.34";
    }

    if (!isCcusageAvailable()) {
      return item.rawValue ? "N/A" : "Today: N/A";
    }

    const aggregates = getCostAggregates();
    if (!aggregates) {
      return item.rawValue ? "N/A" : "Today: N/A";
    }

    const formatted = `$${aggregates.daily.toFixed(2)}`;
    return item.rawValue ? formatted : `Today: ${formatted}`;
  }

  supportsRawValue(): boolean {
    return true;
  }

  supportsColors(item: WidgetItem): boolean {
    return true;
  }
}
