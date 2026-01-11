import type { RenderContext } from "../types/RenderContext";
import type { Settings } from "../types/Settings";
import type { Widget, WidgetEditorDisplay, WidgetItem } from "../types/Widget";
import { getCostAggregates, isCcusageAvailable } from "../utils/ccusage";

export class CostWeeklyWidget implements Widget {
  getDefaultColor(): string {
    return "green";
  }

  getDescription(): string {
    return "Shows last 7 days total cost from ccusage";
  }

  getDisplayName(): string {
    return "Cost (Weekly)";
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
      return item.rawValue ? "$89.50" : "Week: $89.50";
    }

    if (!isCcusageAvailable()) {
      return item.rawValue ? "N/A" : "Week: N/A";
    }

    const aggregates = getCostAggregates();
    if (!aggregates) {
      return item.rawValue ? "N/A" : "Week: N/A";
    }

    const formatted = `$${aggregates.weekly.toFixed(2)}`;
    return item.rawValue ? formatted : `Week: ${formatted}`;
  }

  supportsRawValue(): boolean {
    return true;
  }

  supportsColors(item: WidgetItem): boolean {
    return true;
  }
}
