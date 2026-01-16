import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { ClaudeUsageResponse } from '../types/ClaudeUsageApi';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'ccstatusline');
const LOG_PATH = path.join(CONFIG_DIR, 'log.txt');
const CREDENTIALS_PATH = path.join(os.homedir(), '.claude', '.credentials.json');
const CACHE_DURATION_MS = 60_000; // 60 seconds

// OAuth API endpoint
const USAGE_API_URL = 'https://api.anthropic.com/api/oauth/usage';

interface OAuthCredentials {
    claudeAiOauth?: {
        accessToken: string;
        refreshToken?: string;
        expiresAt?: number;
        subscriptionType?: string;
        rateLimitTier?: string;
    };
}

interface UsageCache {
    data: ClaudeUsageResponse | null;
    timestamp: number;
    tokenExpired?: boolean;
}

let usageCache: UsageCache | null = null;
let credentialsCache: string | null = null;

function logError(context: string, error: unknown): void {
    try {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
        }
        const timestamp = new Date().toISOString();
        const errorMsg = error instanceof Error ? error.message : String(error);
        const logLine = `[${timestamp}] [${context}] ${errorMsg}\n`;
        fs.appendFileSync(LOG_PATH, logLine, { mode: 0o600 });
    } catch {
        // Ignore logging errors
    }
}

/**
 * Get OAuth access token from Claude Code credentials
 * Supports: Linux/Windows (~/.claude/.credentials.json)
 */
function getOAuthToken(): string | null {
    if (credentialsCache) {
        return credentialsCache;
    }

    try {
        if (!fs.existsSync(CREDENTIALS_PATH)) {
            logError('getOAuthToken', 'Credentials file not found');
            return null;
        }

        const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
        const credentials = JSON.parse(content) as OAuthCredentials;
        const token = credentials.claudeAiOauth?.accessToken;

        if (!token) {
            logError('getOAuthToken', 'No OAuth token in credentials');
            return null;
        }

        credentialsCache = token;
        return token;
    } catch (error) {
        logError('getOAuthToken', error);
        return null;
    }
}

/**
 * Fetch usage from Anthropic OAuth API
 */
async function fetchUsage(): Promise<ClaudeUsageResponse | null> {
    const token = getOAuthToken();
    if (!token) {
        usageCache = { data: null, timestamp: Date.now(), tokenExpired: true };
        return null;
    }

    try {
        const response = await fetch(USAGE_API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'anthropic-beta': 'oauth-2025-04-20',
                'User-Agent': 'ccstatusline/1.0'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logError('fetchUsage', 'Token expired or invalid');
                credentialsCache = null;
                usageCache = { data: null, timestamp: Date.now(), tokenExpired: true };
                return null;
            }
            logError('fetchUsage', `API error: ${response.status}`);
            usageCache = { data: null, timestamp: Date.now() };
            return null;
        }

        const data = await response.json() as ClaudeUsageResponse;
        usageCache = { data, timestamp: Date.now(), tokenExpired: false };
        return data;
    } catch (error) {
        logError('fetchUsage', error);
        usageCache = { data: null, timestamp: Date.now() };
        return null;
    }
}

/**
 * Synchronous fetch using curl (for compatibility with existing widget)
 */
function fetchUsageSync(): ClaudeUsageResponse | null {
    const token = getOAuthToken();
    if (!token) {
        usageCache = { data: null, timestamp: Date.now(), tokenExpired: true };
        return null;
    }

    try {
        const { execSync } = require('node:child_process');
        const result = execSync(
            `curl -s "${USAGE_API_URL}" ` +
            `-H "Accept: application/json" ` +
            `-H "Authorization: Bearer ${token}" ` +
            `-H "anthropic-beta: oauth-2025-04-20"`,
            { encoding: 'utf-8', timeout: 10_000 }
        );

        const data = JSON.parse(result) as ClaudeUsageResponse;

        // Check for error response
        if ((data as any).error) {
            logError('fetchUsageSync', `API error: ${JSON.stringify((data as any).error)}`);
            if ((data as any).error.type === 'authentication_error') {
                credentialsCache = null;
                usageCache = { data: null, timestamp: Date.now(), tokenExpired: true };
            } else {
                usageCache = { data: null, timestamp: Date.now() };
            }
            return null;
        }

        usageCache = { data, timestamp: Date.now(), tokenExpired: false };
        return data;
    } catch (error) {
        logError('fetchUsageSync', error);
        usageCache = { data: null, timestamp: Date.now() };
        return null;
    }
}

// Public API (maintains backward compatibility)

export async function getClaudeUsage(): Promise<ClaudeUsageResponse | null> {
    if (usageCache && Date.now() - usageCache.timestamp < CACHE_DURATION_MS) {
        return usageCache.data;
    }
    return fetchUsage();
}

export function getClaudeUsageSync(): ClaudeUsageResponse | null {
    if (usageCache && Date.now() - usageCache.timestamp < CACHE_DURATION_MS) {
        return usageCache.data;
    }
    return fetchUsageSync();
}

export function clearUsageCache(): void {
    usageCache = null;
    credentialsCache = null;
}

export function isClaudeUsageAvailable(): boolean {
    return getOAuthToken() !== null;
}

export function isTokenExpired(): boolean {
    return usageCache?.tokenExpired === true;
}

export function getTimeUntilReset(): string | null {
    if (!usageCache?.data?.five_hour?.resets_at) {
        return null;
    }

    const resetTime = new Date(usageCache.data.five_hour.resets_at).getTime();
    const now = Date.now();
    const diffMs = resetTime - now;

    if (diffMs <= 0) {
        return 'now';
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h${minutes}m`;
    }
    return `${minutes}m`;
}

export function getResetTimeLocal(): string | null {
    if (!usageCache?.data?.five_hour?.resets_at) {
        return null;
    }

    const resetTime = new Date(usageCache.data.five_hour.resets_at);
    const now = Date.now();

    if (resetTime.getTime() <= now) {
        return 'now';
    }

    const hours = resetTime.getHours().toString().padStart(2, '0');
    const minutes = resetTime.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}
