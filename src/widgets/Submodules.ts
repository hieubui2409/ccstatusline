import { execSync } from 'node:child_process';

import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

// Cache for submodule count - longer duration since rarely changes
let submodulesCache: { count: number | null; timestamp: number } | null = null;
const CACHE_DURATION_MS = 300_000; // 5 minutes

export class SubmodulesWidget implements Widget {
    getDefaultColor(): string {
        return 'blue';
    }

    getDescription(): string {
        return 'Shows count of git submodules';
    }

    getDisplayName(): string {
        return 'Submodules';
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
            return item.rawValue ? '3' : 'Submodules: 3';
        }

        const count = this.getSubmoduleCount();
        if (count === null) {
            return null; // Not in a git repo or no submodules
        }

        if (count === 0) {
            return null; // Hide if no submodules
        }

        const formatted = count.toString();
        return item.rawValue ? formatted : `Submodules: ${formatted}`;
    }

    private getSubmoduleCount(): number | null {
    // Check cache
        if (
            submodulesCache
            && Date.now() - submodulesCache.timestamp < CACHE_DURATION_MS
        ) {
            return submodulesCache.count;
        }

        try {
            const output = execSync('git submodule status 2>/dev/null | wc -l', {
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 5000
            });

            const count = parseInt(output.trim(), 10);
            submodulesCache = {
                count: isNaN(count) ? 0 : count,
                timestamp: Date.now()
            };
            return submodulesCache.count;
        } catch {
            submodulesCache = { count: null, timestamp: Date.now() };
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