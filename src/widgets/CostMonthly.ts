import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

export class CostMonthlyWidget implements Widget {
    getDefaultColor(): string {
        return 'green';
    }

    getDescription(): string {
        return 'Shows last 30 days total cost from ccusage';
    }

    getDisplayName(): string {
        return 'Cost (Monthly)';
    }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(
        item: WidgetItem,
        context: RenderContext,
        settings: Settings
    ): string | null {
        if (context.isPreview) {
            return item.rawValue ? '$245.00' : 'Month: $245.00';
        }

        const aggregates = context.costAggregates;
        if (aggregates === undefined) {
            return item.rawValue ? '--' : 'Month: --';
        }
        if (aggregates === null) {
            return item.rawValue ? 'N/A' : 'Month: N/A';
        }

        const formatted = `$${aggregates.monthly.toFixed(2)}`;
        return item.rawValue ? formatted : `Month: ${formatted}`;
    }

    supportsRawValue(): boolean {
        return true;
    }

    supportsColors(item: WidgetItem): boolean {
        return true;
    }
}