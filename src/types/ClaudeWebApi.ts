export interface ClaudeWebUsageResponse {
    five_hour: {
        utilization: number;
        resets_at: string;
    } | null;
    seven_day: unknown;
    seven_day_opus: unknown;
    seven_day_sonnet: unknown;
    seven_day_oauth_apps: unknown;
    iguana_necktie: unknown;
    extra_usage: unknown;
}

export interface ClaudeOrganization {
    uuid: string;
    name: string;
    join_token: string | null;
    active_subscription: unknown;
}

export interface ClaudeWebConfig {
    sessionKey: string;
    organizationId?: string;
}

export interface ExtractedSession {
    sessionKey: string;
    organizationId?: string;
    browser?: string;
    error?: string;
}