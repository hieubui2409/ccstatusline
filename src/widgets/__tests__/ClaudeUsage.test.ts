import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type {
    RenderContext,
    WidgetItem
} from '../../types';
import type { ClaudeUsageResponse } from '../../types/ClaudeUsageApi';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import {
    getClaudeUsageSync,
    getTimeUntilReset,
    isClaudeUsageAvailable,
    isTokenExpired
} from '../../utils/claude-usage-api';
import { ClaudeUsageWidget } from '../ClaudeUsage';

vi.mock('../../utils/claude-usage-api', () => ({
    isClaudeUsageAvailable: vi.fn(),
    isTokenExpired: vi.fn(),
    getClaudeUsageSync: vi.fn(),
    getTimeUntilReset: vi.fn()
}));

const mockedIsClaudeUsageAvailable = isClaudeUsageAvailable as ReturnType<
  typeof vi.fn
>;
const mockedIsTokenExpired = isTokenExpired as ReturnType<typeof vi.fn>;
const mockedGetClaudeUsageSync = getClaudeUsageSync as ReturnType<
  typeof vi.fn
>;
const mockedGetTimeUntilReset = getTimeUntilReset as ReturnType<typeof vi.fn>;

function createUsageResponse(utilization: number): ClaudeUsageResponse {
    return {
        five_hour: { utilization, resets_at: '2026-01-11T15:00:00Z' },
        seven_day: null,
        seven_day_opus: null,
        seven_day_sonnet: null,
        seven_day_oauth_apps: null,
        iguana_necktie: null,
        extra_usage: null
    };
}

describe('ClaudeUsageWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Preview mode', () => {
        it('should render preview with percentage mode (default)', () => {
            const widget = new ClaudeUsageWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: 51%');
        });

        it('should render preview with time mode', () => {
            const widget = new ClaudeUsageWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false,
                metadata: { display: 'time' }
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: 2h30m');
        });

        it('should render preview with progress bar mode', () => {
            const widget = new ClaudeUsageWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false,
                metadata: { display: 'progress' }
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: [████████████████░░░░░░░░░░░░░░░░] 51%');
        });

        it('should render preview with progress-short mode', () => {
            const widget = new ClaudeUsageWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false,
                metadata: { display: 'progress-short' }
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: [████████░░░░░░░░] 51%');
        });

        it('should render preview with raw value', () => {
            const widget = new ClaudeUsageWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: true
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('51%');
        });

        it('should render preview time mode with raw value', () => {
            const widget = new ClaudeUsageWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: true,
                metadata: { display: 'time' }
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('2h30m');
        });
    });

    describe('Availability checks', () => {
        it('should return N/A when Claude usage is not available', () => {
            mockedIsClaudeUsageAvailable.mockReturnValue(false);

            const widget = new ClaudeUsageWidget();
            const context: RenderContext = {};
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: N/A');
        });

        it('should return Expired when token is expired', () => {
            mockedIsClaudeUsageAvailable.mockReturnValue(true);
            mockedIsTokenExpired.mockReturnValue(true);

            const widget = new ClaudeUsageWidget();
            const context: RenderContext = {};
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: Expired');
        });
    });

    describe('Live data rendering', () => {
        it('should render percentage mode', () => {
            mockedIsClaudeUsageAvailable.mockReturnValue(true);
            mockedIsTokenExpired.mockReturnValue(false);
            mockedGetClaudeUsageSync.mockReturnValue(createUsageResponse(75));
            mockedGetTimeUntilReset.mockReturnValue('2h30m');

            const widget = new ClaudeUsageWidget();
            const context: RenderContext = {};
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: 75%');
        });

        it('should render time mode', () => {
            mockedIsClaudeUsageAvailable.mockReturnValue(true);
            mockedIsTokenExpired.mockReturnValue(false);
            mockedGetClaudeUsageSync.mockReturnValue(createUsageResponse(75));
            mockedGetTimeUntilReset.mockReturnValue('2h30m');

            const widget = new ClaudeUsageWidget();
            const context: RenderContext = {};
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false,
                metadata: { display: 'time' }
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: 2h30m');
        });

        it('should render time mode with -- when no reset time', () => {
            mockedIsClaudeUsageAvailable.mockReturnValue(true);
            mockedIsTokenExpired.mockReturnValue(false);
            mockedGetClaudeUsageSync.mockReturnValue(createUsageResponse(75));
            mockedGetTimeUntilReset.mockReturnValue(null);

            const widget = new ClaudeUsageWidget();
            const context: RenderContext = {};
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false,
                metadata: { display: 'time' }
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: --');
        });

        it('should render progress bar mode', () => {
            mockedIsClaudeUsageAvailable.mockReturnValue(true);
            mockedIsTokenExpired.mockReturnValue(false);
            mockedGetClaudeUsageSync.mockReturnValue(createUsageResponse(75));
            mockedGetTimeUntilReset.mockReturnValue('2h30m');

            const widget = new ClaudeUsageWidget();
            const context: RenderContext = {};
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false,
                metadata: { display: 'progress' }
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: [████████████████████████░░░░░░░░] 75%');
        });
    });

    describe('No cached data', () => {
        it('should return -- when no cached data', () => {
            mockedIsClaudeUsageAvailable.mockReturnValue(true);
            mockedIsTokenExpired.mockReturnValue(false);
            mockedGetClaudeUsageSync.mockReturnValue(null);

            const widget = new ClaudeUsageWidget();
            const context: RenderContext = {};
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Usage: --');
        });
    });

    describe('Editor actions', () => {
        it('should toggle from percentage to time mode', () => {
            const widget = new ClaudeUsageWidget();
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage'
            };

            const result = widget.handleEditorAction('toggle-mode', item);

            expect(result?.metadata?.display).toBe('time');
        });

        it('should toggle from time to progress mode', () => {
            const widget = new ClaudeUsageWidget();
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                metadata: { display: 'time' }
            };

            const result = widget.handleEditorAction('toggle-mode', item);

            expect(result?.metadata?.display).toBe('progress');
        });

        it('should toggle from progress to progress-short mode', () => {
            const widget = new ClaudeUsageWidget();
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                metadata: { display: 'progress' }
            };

            const result = widget.handleEditorAction('toggle-mode', item);

            expect(result?.metadata?.display).toBe('progress-short');
        });

        it('should toggle from progress-short to percentage mode', () => {
            const widget = new ClaudeUsageWidget();
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                metadata: { display: 'progress-short' }
            };

            const result = widget.handleEditorAction('toggle-mode', item);

            expect(result?.metadata?.display).toBe('percentage');
        });
    });

    describe('Metadata', () => {
        it('should have correct display name', () => {
            const widget = new ClaudeUsageWidget();

            expect(widget.getDisplayName()).toBe('Claude.ai Usage');
        });

        it('should have mode toggle keybind', () => {
            const widget = new ClaudeUsageWidget();
            const keybinds = widget.getCustomKeybinds();

            expect(keybinds).toHaveLength(1);
            expect(keybinds[0]?.key).toBe('o');
            expect(keybinds[0]?.action).toBe('toggle-mode');
        });

        it('should show mode in editor display', () => {
            const widget = new ClaudeUsageWidget();
            const item: WidgetItem = {
                id: 'claude-web-usage',
                type: 'claude-web-usage',
                metadata: { display: 'progress' }
            };

            const display = widget.getEditorDisplay(item);

            expect(display.modifierText).toBe('(progress bar)');
        });
    });
});
