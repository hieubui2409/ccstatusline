import type { RenderContext } from "../types/RenderContext";
import type { Settings } from "../types/Settings";
import type { Widget, WidgetEditorDisplay, WidgetItem } from "../types/Widget";
import { getMcpServerCount } from "../utils/mcp";

export class McpStatusWidget implements Widget {
  getDefaultColor(): string {
    return "cyan";
  }

  getDescription(): string {
    return "Shows MCP server count (active/total)";
  }

  getDisplayName(): string {
    return "MCP Status";
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
      return item.rawValue ? "3/5" : "MCP: 3/5";
    }

    const count = getMcpServerCount();
    if (!count) {
      return item.rawValue ? "N/A" : "MCP: N/A";
    }

    if (count.total === 0) {
      return item.rawValue ? "0" : "MCP: 0";
    }

    const formatted = `${count.active}/${count.total}`;
    return item.rawValue ? formatted : `MCP: ${formatted}`;
  }

  supportsRawValue(): boolean {
    return true;
  }

  supportsColors(item: WidgetItem): boolean {
    return true;
  }
}
