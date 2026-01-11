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
import { BlockProjectionWidget } from '../BlockProjection';
import { BurnRateWidget } from '../BurnRate';

describe('Block Widgets', () => {
    describe('BurnRateWidget', () => {
        it('should render preview mode', () => {
            const widget = new BurnRateWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'burn-rate',
                type: 'burn-rate',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Burn: 1.2K/min');
        });

        it('should render preview mode with raw value', () => {
            const widget = new BurnRateWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'burn-rate',
                type: 'burn-rate',
                rawValue: true
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('1.2K/min');
        });

        it('should return placeholder when activeBlock is undefined', () => {
            const widget = new BurnRateWidget();
            const context: RenderContext = { activeBlock: undefined };
            const item: WidgetItem = {
                id: 'burn-rate',
                type: 'burn-rate',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Burn: --');
        });

        it('should return placeholder when activeBlock is null', () => {
            const widget = new BurnRateWidget();
            const context: RenderContext = { activeBlock: null };
            const item: WidgetItem = {
                id: 'burn-rate',
                type: 'burn-rate',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Burn: --');
        });

        it('should return -- when burnRate is null', () => {
            const widget = new BurnRateWidget();
            const context: RenderContext = {
                activeBlock: {
                    costUSD: 10.0,
                    burnRate: null,
                    projection: null,
                    startTime: '2026-01-11T10:00:00Z',
                    endTime: '2026-01-11T11:00:00Z',
                    totalTokens: 1000
                }
            };
            const item: WidgetItem = {
                id: 'burn-rate',
                type: 'burn-rate',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Burn: --');
        });

        it('should format burn rate in K/min when >= 1000', () => {
            const widget = new BurnRateWidget();
            const context: RenderContext = {
                activeBlock: {
                    costUSD: 10.0,
                    burnRate: 2500,
                    projection: null,
                    startTime: '2026-01-11T10:00:00Z',
                    endTime: '2026-01-11T11:00:00Z',
                    totalTokens: 1000
                }
            };
            const item: WidgetItem = {
                id: 'burn-rate',
                type: 'burn-rate',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Burn: 2.5K/min');
        });

        it('should format burn rate in /min when < 1000', () => {
            const widget = new BurnRateWidget();
            const context: RenderContext = {
                activeBlock: {
                    costUSD: 10.0,
                    burnRate: 450,
                    projection: null,
                    startTime: '2026-01-11T10:00:00Z',
                    endTime: '2026-01-11T11:00:00Z',
                    totalTokens: 1000
                }
            };
            const item: WidgetItem = {
                id: 'burn-rate',
                type: 'burn-rate',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Burn: 450/min');
        });

        it('should support raw value output', () => {
            const widget = new BurnRateWidget();
            const context: RenderContext = {
                activeBlock: {
                    costUSD: 10.0,
                    burnRate: 1500,
                    projection: null,
                    startTime: '2026-01-11T10:00:00Z',
                    endTime: '2026-01-11T11:00:00Z',
                    totalTokens: 1000
                }
            };
            const item: WidgetItem = {
                id: 'burn-rate',
                type: 'burn-rate',
                rawValue: true
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('1.5K/min');
        });

        it('should have correct metadata', () => {
            const widget = new BurnRateWidget();
            const item: WidgetItem = { id: 'burn-rate', type: 'burn-rate' };

            expect(widget.getDisplayName()).toBe('Burn Rate');
            expect(widget.supportsRawValue()).toBe(true);
            expect(widget.supportsColors(item)).toBe(true);
            expect(widget.getDefaultColor()).toBe('yellow');
        });
    });

    describe('BlockProjectionWidget', () => {
        it('should render preview mode', () => {
            const widget = new BlockProjectionWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'block-projection',
                type: 'block-projection',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Proj: $45.00');
        });

        it('should render preview mode with raw value', () => {
            const widget = new BlockProjectionWidget();
            const context: RenderContext = { isPreview: true };
            const item: WidgetItem = {
                id: 'block-projection',
                type: 'block-projection',
                rawValue: true
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('$45.00');
        });

        it('should return placeholder when activeBlock is undefined', () => {
            const widget = new BlockProjectionWidget();
            const context: RenderContext = { activeBlock: undefined };
            const item: WidgetItem = {
                id: 'block-projection',
                type: 'block-projection',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Proj: --');
        });

        it('should return placeholder when activeBlock is null', () => {
            const widget = new BlockProjectionWidget();
            const context: RenderContext = { activeBlock: null };
            const item: WidgetItem = {
                id: 'block-projection',
                type: 'block-projection',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Proj: --');
        });

        it('should return -- when projection is null', () => {
            const widget = new BlockProjectionWidget();
            const context: RenderContext = {
                activeBlock: {
                    costUSD: 10.0,
                    burnRate: 1000,
                    projection: null,
                    startTime: '2026-01-11T10:00:00Z',
                    endTime: '2026-01-11T11:00:00Z',
                    totalTokens: 1000
                }
            };
            const item: WidgetItem = {
                id: 'block-projection',
                type: 'block-projection',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Proj: --');
        });

        it('should format projected cost correctly', () => {
            const widget = new BlockProjectionWidget();
            const context: RenderContext = {
                activeBlock: {
                    costUSD: 10.0,
                    burnRate: 1000,
                    projection: {
                        projectedCostUSD: 123.456,
                        projectedTokens: 5000,
                        projectedEndTime: '2026-01-11T12:00:00Z',
                        burnRate: 1000
                    },
                    startTime: '2026-01-11T10:00:00Z',
                    endTime: '2026-01-11T11:00:00Z',
                    totalTokens: 1000
                }
            };
            const item: WidgetItem = {
                id: 'block-projection',
                type: 'block-projection',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Proj: $123.46');
        });

        it('should format with 2 decimal places', () => {
            const widget = new BlockProjectionWidget();
            const context: RenderContext = {
                activeBlock: {
                    costUSD: 10.0,
                    burnRate: 1000,
                    projection: {
                        projectedCostUSD: 99.9,
                        projectedTokens: 5000,
                        projectedEndTime: '2026-01-11T12:00:00Z',
                        burnRate: 1000
                    },
                    startTime: '2026-01-11T10:00:00Z',
                    endTime: '2026-01-11T11:00:00Z',
                    totalTokens: 1000
                }
            };
            const item: WidgetItem = {
                id: 'block-projection',
                type: 'block-projection',
                rawValue: false
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('Proj: $99.90');
        });

        it('should support raw value output', () => {
            const widget = new BlockProjectionWidget();
            const context: RenderContext = {
                activeBlock: {
                    costUSD: 10.0,
                    burnRate: 1000,
                    projection: {
                        projectedCostUSD: 75.5,
                        projectedTokens: 5000,
                        projectedEndTime: '2026-01-11T12:00:00Z',
                        burnRate: 1000
                    },
                    startTime: '2026-01-11T10:00:00Z',
                    endTime: '2026-01-11T11:00:00Z',
                    totalTokens: 1000
                }
            };
            const item: WidgetItem = {
                id: 'block-projection',
                type: 'block-projection',
                rawValue: true
            };

            const result = widget.render(item, context, DEFAULT_SETTINGS);

            expect(result).toBe('$75.50');
        });

        it('should have correct metadata', () => {
            const widget = new BlockProjectionWidget();
            const item: WidgetItem = {
                id: 'block-projection',
                type: 'block-projection'
            };

            expect(widget.getDisplayName()).toBe('Block Projection');
            expect(widget.supportsRawValue()).toBe(true);
            expect(widget.supportsColors(item)).toBe(true);
            expect(widget.getDefaultColor()).toBe('magenta');
        });
    });
});