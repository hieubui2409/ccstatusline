import type { BlockMetrics } from '../types';

import type {
    ActiveBlockData,
    CostAggregates
} from './CcusageData';
import type { StatusJSON } from './StatusJSON';
import type { TokenMetrics } from './TokenMetrics';

export interface RenderContext {
    data?: StatusJSON;
    tokenMetrics?: TokenMetrics | null;
    sessionDuration?: string | null;
    blockMetrics?: BlockMetrics | null;
    terminalWidth?: number | null;
    isPreview?: boolean;
    lineIndex?: number; // Index of the current line being rendered (for theme cycling)
    globalSeparatorIndex?: number; // Global separator index that continues across lines
    // Ccusage data - lazy loaded, undefined = not checked, null = unavailable
    costAggregates?: CostAggregates | null;
    activeBlock?: ActiveBlockData | null;
}