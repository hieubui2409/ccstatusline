import {
    describe,
    expect,
    it
} from 'vitest';

import type {
    RenderContext,
    WidgetItem
} from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import { CostDailyWidget } from '../CostDaily';
import { CostMonthlyWidget } from '../CostMonthly';
import { CostWeeklyWidget } from '../CostWeekly';

describe('Cost Widgets', () => {
    describe('CostDailyWidget', () => {
        it('should render preview mode with formatted cost', () => {
            const widget = new CostDailyWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'cost-daily',
                type: 'cost-daily',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Today: $12.34');
        });

        it('should render preview mode with raw value', () => {
            const widget = new CostDailyWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'cost-daily',
                type: 'cost-daily',
                rawValue: true
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('$12.34');
        });

        it('should return placeholder when costAggregates is undefined', () => {
            const widget = new CostDailyWidget();
            const context: RenderContext = { costAggregates: undefined };
            const item: WidgetItem = {
                id: 'cost-daily',
                type: 'cost-daily',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Today: --');
        });

        it('should return N/A when costAggregates is null', () => {
            const widget = new CostDailyWidget();
            const context: RenderContext = { costAggregates: null };
            const item: WidgetItem = {
                id: 'cost-daily',
                type: 'cost-daily',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Today: N/A');
        });

        it('should format daily cost correctly with 2 decimal places', () => {
            const widget = new CostDailyWidget();
            const context: RenderContext = { costAggregates: { daily: 42.5678, weekly: 100, monthly: 200 } };
            const item: WidgetItem = {
                id: 'cost-daily',
                type: 'cost-daily',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Today: $42.57');
        });

        it('should support raw value output', () => {
            const widget = new CostDailyWidget();
            const context: RenderContext = { costAggregates: { daily: 12.34, weekly: 100, monthly: 200 } };
            const item: WidgetItem = {
                id: 'cost-daily',
                type: 'cost-daily',
                rawValue: true
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('$12.34');
        });

        it('should support color customization', () => {
            const widget = new CostDailyWidget();
            const item: WidgetItem = { id: 'cost-daily', type: 'cost-daily' };

            expect(widget.supportsColors(item)).toBe(true);
            expect(widget.getDefaultColor()).toBe('green');
        });

        it('should have correct display name', () => {
            const widget = new CostDailyWidget();

            expect(widget.getDisplayName()).toBe('Cost (Daily)');
            expect(widget.getDescription()).toContain('today');
        });
    });

    describe('CostWeeklyWidget', () => {
        it('should render preview mode with formatted cost', () => {
            const widget = new CostWeeklyWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'cost-weekly',
                type: 'cost-weekly',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Week: $89.50');
        });

        it('should return placeholder when costAggregates is undefined', () => {
            const widget = new CostWeeklyWidget();
            const context: RenderContext = { costAggregates: undefined };
            const item: WidgetItem = {
                id: 'cost-weekly',
                type: 'cost-weekly',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Week: --');
        });

        it('should return N/A when costAggregates is null', () => {
            const widget = new CostWeeklyWidget();
            const context: RenderContext = { costAggregates: null };
            const item: WidgetItem = {
                id: 'cost-weekly',
                type: 'cost-weekly',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Week: N/A');
        });

        it('should format weekly cost correctly', () => {
            const widget = new CostWeeklyWidget();
            const context: RenderContext = { costAggregates: { daily: 12.34, weekly: 87.654, monthly: 200 } };
            const item: WidgetItem = {
                id: 'cost-weekly',
                type: 'cost-weekly',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Week: $87.65');
        });

        it('should support raw value output', () => {
            const widget = new CostWeeklyWidget();
            const context: RenderContext = { costAggregates: { daily: 12.34, weekly: 89.5, monthly: 200 } };
            const item: WidgetItem = {
                id: 'cost-weekly',
                type: 'cost-weekly',
                rawValue: true
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('$89.50');
        });

        it('should have correct display name', () => {
            const widget = new CostWeeklyWidget();

            expect(widget.getDisplayName()).toBe('Cost (Weekly)');
            expect(widget.getDescription()).toContain('7 days');
        });
    });

    describe('CostMonthlyWidget', () => {
        it('should render preview mode with formatted cost', () => {
            const widget = new CostMonthlyWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'cost-monthly',
                type: 'cost-monthly',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Month: $245.00');
        });

        it('should return placeholder when costAggregates is undefined', () => {
            const widget = new CostMonthlyWidget();
            const context: RenderContext = { costAggregates: undefined };
            const item: WidgetItem = {
                id: 'cost-monthly',
                type: 'cost-monthly',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Month: --');
        });

        it('should return N/A when costAggregates is null', () => {
            const widget = new CostMonthlyWidget();
            const context: RenderContext = { costAggregates: null };
            const item: WidgetItem = {
                id: 'cost-monthly',
                type: 'cost-monthly',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Month: N/A');
        });

        it('should format monthly cost correctly', () => {
            const widget = new CostMonthlyWidget();
            const context: RenderContext = { costAggregates: { daily: 12.34, weekly: 89.5, monthly: 234.5678 } };
            const item: WidgetItem = {
                id: 'cost-monthly',
                type: 'cost-monthly',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Month: $234.57');
        });

        it('should support raw value output', () => {
            const widget = new CostMonthlyWidget();
            const context: RenderContext = { costAggregates: { daily: 12.34, weekly: 89.5, monthly: 245.0 } };
            const item: WidgetItem = {
                id: 'cost-monthly',
                type: 'cost-monthly',
                rawValue: true
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('$245.00');
        });

        it('should have correct display name', () => {
            const widget = new CostMonthlyWidget();

            expect(widget.getDisplayName()).toBe('Cost (Monthly)');
            expect(widget.getDescription()).toContain('30 days');
        });
    });
});