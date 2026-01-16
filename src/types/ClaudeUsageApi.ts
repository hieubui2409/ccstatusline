/**
 * Response from Anthropic OAuth Usage API
 * Endpoint: https://api.anthropic.com/api/oauth/usage
 */
export interface ClaudeUsageResponse {
    five_hour: {
        utilization: number;
        resets_at: string;
    } | null;
    seven_day: unknown;
    seven_day_opus: unknown;
    seven_day_sonnet: unknown;
    seven_day_oauth_apps: unknown;
    iguana_necktie: unknown;
    extra_usage: {
        is_enabled: boolean;
        monthly_limit: number | null;
        used_credits: number | null;
        utilization: number | null;
    } | null;
}
