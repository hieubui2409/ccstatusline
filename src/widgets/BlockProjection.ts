import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

export class BlockProjectionWidget implements Widget {
    getDefaultColor(): string {
        return 'magenta';
    }

    getDescription(): string {
        return 'Shows projected end-of-block cost';
    }

    getDisplayName(): string {
        return 'Block Projection';
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
            return item.rawValue ? '$45.00' : 'Proj: $45.00';
        }

        const block = context.activeBlock;
        if (block === undefined) {
            return item.rawValue ? '--' : 'Proj: --';
        }
        if (!block?.projection) {
            return item.rawValue ? '--' : 'Proj: --';
        }

        const formatted = `$${block.projection.projectedCostUSD.toFixed(2)}`;
        return item.rawValue ? formatted : `Proj: ${formatted}`;
    }

    supportsRawValue(): boolean {
        return true;
    }

    supportsColors(item: WidgetItem): boolean {
        return true;
    }
}