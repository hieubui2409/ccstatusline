// Daily report types
export interface DailyEntry {
    date: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    totalTokens: number;
    totalCost: number;
    modelsUsed: string[];
}

export interface DailyReport {
    daily: DailyEntry[];
    totals: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        totalCost: number;
    };
}

// Block report types
export interface BlockProjection {
    projectedCostUSD: number;
    projectedTokens: number;
    projectedEndTime: string;
    burnRate: number;
}

export interface BlockEntry {
    id: string;
    startTime: string;
    endTime: string;
    actualEndTime: string | null;
    isActive: boolean;
    isGap: boolean;
    entries: number;
    tokenCounts: {
        inputTokens: number;
        outputTokens: number;
        cacheCreationInputTokens: number;
        cacheReadInputTokens: number;
    };
    totalTokens: number;
    costUSD: number;
    models: string[];
    burnRate: number | null;
    projection: BlockProjection | null;
}

export interface BlocksReport { blocks: BlockEntry[] }

// Aggregated data for widgets
export interface CostAggregates {
    daily: number; // Today's cost
    weekly: number; // Last 7 days
    monthly: number; // Last 30 days
}

export interface ActiveBlockData {
    costUSD: number;
    burnRate: number | null;
    projection: BlockProjection | null;
    startTime: string;
    endTime: string;
    totalTokens: number;
}