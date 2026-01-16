import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetItemType
} from '../types/Widget';
import * as widgets from '../widgets';

// Create widget registry - organized by category, custom widgets last
const widgetRegistry = new Map<WidgetItemType, Widget>([
    // Model & version info
    ['model', new widgets.ModelWidget()],
    ['version', new widgets.VersionWidget()],
    ['output-style', new widgets.OutputStyleWidget()],

    // Git widgets
    ['git-branch', new widgets.GitBranchWidget()],
    ['git-changes', new widgets.GitChangesWidget()],
    ['git-worktree', new widgets.GitWorktreeWidget()],
    ['commits', new widgets.CommitsWidget()],
    ['submodules', new widgets.SubmodulesWidget()],

    // Token widgets
    ['tokens-input', new widgets.TokensInputWidget()],
    ['tokens-output', new widgets.TokensOutputWidget()],
    ['tokens-cached', new widgets.TokensCachedWidget()],
    ['tokens-total', new widgets.TokensTotalWidget()],

    // Context widgets
    ['context-length', new widgets.ContextLengthWidget()],
    ['context-percentage', new widgets.ContextPercentageWidget()],
    ['context-percentage-usable', new widgets.ContextPercentageUsableWidget()],

    // Session & time widgets
    ['session-clock', new widgets.SessionClockWidget()],
    ['block-timer', new widgets.BlockTimerWidget()],

    // Cost widgets
    ['session-cost', new widgets.SessionCostWidget()],
    ['cost-daily', new widgets.CostDailyWidget()],
    ['cost-weekly', new widgets.CostWeeklyWidget()],
    ['cost-monthly', new widgets.CostMonthlyWidget()],

    // Block widgets
    ['burn-rate', new widgets.BurnRateWidget()],
    ['block-projection', new widgets.BlockProjectionWidget()],

    // Claude usage & session widgets
    ['claude-web-usage', new widgets.ClaudeUsageWidget()],
    ['claude-session-id', new widgets.ClaudeSessionIdWidget()],

    // Environment widgets
    ['current-working-dir', new widgets.CurrentWorkingDirWidget()],
    ['terminal-width', new widgets.TerminalWidthWidget()],
    ['mcp-status', new widgets.McpStatusWidget()],

    // Custom widgets (always last)
    ['custom-text', new widgets.CustomTextWidget()],
    ['custom-command', new widgets.CustomCommandWidget()]
]);

export function getWidget(type: WidgetItemType): Widget | null {
    return widgetRegistry.get(type) ?? null;
}

export function getAllWidgetTypes(settings: Settings): WidgetItemType[] {
    const allTypes = Array.from(widgetRegistry.keys());

    // Add separator types based on settings
    if (!settings.powerline.enabled) {
        if (!settings.defaultSeparator) {
            allTypes.push('separator');
        }
        allTypes.push('flex-separator');
    }

    return allTypes;
}

export function isKnownWidgetType(type: string): boolean {
    return (
        widgetRegistry.has(type)
        || type === 'separator'
        || type === 'flex-separator'
    );
}