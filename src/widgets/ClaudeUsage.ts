import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    getClaudeUsageSync,
    getTimeUntilReset,
    isClaudeUsageAvailable,
    isTokenExpired
} from '../utils/claude-usage-api';

type DisplayMode = 'percentage' | 'time' | 'progress' | 'progress-short';

export class ClaudeUsageWidget implements Widget {
    getDefaultColor(): string {
        return 'magenta';
    }

    getDescription(): string {
        return 'Shows Claude 5-hour usage percentage (requires Claude Code login)';
    }

    getDisplayName(): string {
        return 'Claude.ai Usage';
    }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const mode = (item.metadata?.display ?? 'percentage') as DisplayMode;
        const modeLabels: Record<DisplayMode, string> = {
            'percentage': 'percentage',
            'time': 'timer',
            'progress': 'progress bar',
            'progress-short': 'short bar'
        };

        return {
            displayText: this.getDisplayName(),
            modifierText: `(${modeLabels[mode]})`
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === 'toggle-mode') {
            const modes: DisplayMode[] = [
                'percentage',
                'time',
                'progress',
                'progress-short'
            ];
            const currentMode = (item.metadata?.display
                ?? 'percentage') as DisplayMode;
            const currentIndex = modes.indexOf(currentMode);
            const nextIndex = (currentIndex + 1) % modes.length;

            const nextMode = modes[nextIndex] ?? 'percentage';
            return {
                ...item,
                metadata: {
                    ...item.metadata,
                    display: nextMode
                }
            };
        }
        return null;
    }

    render(
        item: WidgetItem,
        context: RenderContext,
        _settings: Settings
    ): string | null {
        const displayMode = (item.metadata?.display ?? 'percentage') as DisplayMode;

        if (context.isPreview) {
            return this.formatOutput(item, displayMode, 51, '2h30m');
        }

        try {
            if (!isClaudeUsageAvailable()) {
                return item.rawValue ? 'N/A' : 'Usage: N/A';
            }

            if (isTokenExpired()) {
                return item.rawValue ? 'Expired' : 'Usage: Expired';
            }

            const usage = getClaudeUsageSync();
            if (!usage?.five_hour) {
                return item.rawValue ? '--' : 'Usage: --';
            }

            const pct = Math.round(usage.five_hour.utilization);
            const resetTime = getTimeUntilReset();

            return this.formatOutput(item, displayMode, pct, resetTime);
        } catch {
            return item.rawValue ? '--' : 'Usage: --';
        }
    }

    private formatOutput(
        item: WidgetItem,
        displayMode: DisplayMode,
        pct: number,
        resetTime: string | null
    ): string {
        const prefix = item.rawValue ? '' : 'Usage: ';

        switch (displayMode) {
        case 'percentage':
            return `${prefix}${pct}%`;

        case 'time':
            return `${prefix}${resetTime ?? '--'}`;

        case 'progress':
        case 'progress-short': {
            const barWidth = displayMode === 'progress' ? 32 : 16;
            const filledWidth = Math.floor((pct / 100) * barWidth);
            const emptyWidth = barWidth - filledWidth;
            const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
            return `${prefix}[${progressBar}] ${pct}%`;
        }
        }
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [{ key: 'o', label: 'm(o)de', action: 'toggle-mode' }];
    }

    supportsRawValue(): boolean {
        return true;
    }

    supportsColors(): boolean {
        return true;
    }
}