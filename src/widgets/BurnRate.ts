import type { RenderContext } from "../types/RenderContext";
import type { Settings } from "../types/Settings";
import type { Widget, WidgetEditorDisplay, WidgetItem } from "../types/Widget";
import { getActiveBlock, isCcusageAvailable } from "../utils/ccusage";

export class BurnRateWidget implements Widget {
  getDefaultColor(): string {
    return "yellow";
  }

  getDescription(): string {
    return "Shows current token burn rate (tokens/min)";
  }

  getDisplayName(): string {
    return "Burn Rate";
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
      return item.rawValue ? "1.2K/min" : "Burn: 1.2K/min";
    }

    if (!isCcusageAvailable()) {
      return item.rawValue ? "N/A" : "Burn: N/A";
    }

    const block = getActiveBlock();
    if (!block?.burnRate) {
      return item.rawValue ? "--" : "Burn: --";
    }

    const formatted = this.formatBurnRate(block.burnRate);
    return item.rawValue ? formatted : `Burn: ${formatted}`;
  }

  private formatBurnRate(tokensPerMin: number): string {
    if (tokensPerMin >= 1000) {
      return `${(tokensPerMin / 1000).toFixed(1)}K/min`;
    }
    return `${Math.round(tokensPerMin)}/min`;
  }

  supportsRawValue(): boolean {
    return true;
  }

  supportsColors(item: WidgetItem): boolean {
    return true;
  }
}
