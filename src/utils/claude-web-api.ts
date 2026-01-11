import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  ClaudeOrganization,
  ClaudeWebConfig,
  ClaudeWebUsageResponse,
  ExtractedSession,
} from "../types/ClaudeWebApi";

const CONFIG_DIR = path.join(os.homedir(), ".config", "ccstatusline");
const CONFIG_PATH = path.join(CONFIG_DIR, "claude-web.json");
const CACHE_DURATION_MS = 60_000;
const SESSION_CHECK_INTERVAL_MS = 300_000; // 5 minutes

function getScriptPath(): string | null {
  const scriptName = "extract-session-key.py";

  // Try multiple possible locations
  const candidates: string[] = [];

  // 1. Relative to this module (for npm package installation)
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(path.join(moduleDir, "..", "..", "scripts", scriptName));
    candidates.push(path.join(moduleDir, "..", "scripts", scriptName));
  } catch {
    // import.meta.url may not work in all environments
  }

  // 2. Relative to __dirname (for local development with Bun)
  if (typeof __dirname !== "undefined") {
    candidates.push(path.join(__dirname, "..", "..", "scripts", scriptName));
    candidates.push(path.join(__dirname, "..", "scripts", scriptName));
  }

  // 3. User's config directory (manual installation fallback)
  candidates.push(path.join(CONFIG_DIR, scriptName));

  // 4. Global npm location
  try {
    const globalDir = execSync("npm root -g", {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    candidates.push(
      path.join(globalDir, "ccstatusline", "scripts", scriptName),
    );
  } catch {
    // Ignore if npm not available
  }

  for (const candidate of candidates) {
    try {
      const resolved = path.resolve(candidate);
      if (fs.existsSync(resolved)) {
        return resolved;
      }
    } catch {
      // Skip invalid paths
    }
  }

  return null;
}

interface UsageCache {
  data: ClaudeWebUsageResponse | null;
  timestamp: number;
  sessionExpired?: boolean;
}

let usageCache: UsageCache | null = null;
let configCache: ClaudeWebConfig | null = null;
let lastSessionCheck = 0;

export function extractSessionFromBrowser(): ExtractedSession | null {
  try {
    const scriptPath = getScriptPath();
    if (!scriptPath) {
      return null;
    }
    const result = execSync(`python3 "${scriptPath}"`, {
      encoding: "utf-8",
      timeout: 10_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const parsed = JSON.parse(result.trim()) as ExtractedSession;
    if (parsed.error) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function loadConfigFromFile(): ClaudeWebConfig | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(content) as ClaudeWebConfig;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveConfigToFile(config: ClaudeWebConfig): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), {
      mode: 0o600,
    });
  } catch {
    // Ignore write errors
  }
}

export function getClaudeWebConfig(): ClaudeWebConfig | null {
  if (configCache) return configCache;

  // Try config file first
  const fileConfig = loadConfigFromFile();
  if (fileConfig?.sessionKey) {
    configCache = fileConfig;
    return configCache;
  }

  // Try browser extraction
  const extracted = extractSessionFromBrowser();
  if (extracted?.sessionKey) {
    configCache = {
      sessionKey: extracted.sessionKey,
      organizationId: extracted.organizationId,
    };
    saveConfigToFile(configCache);
    return configCache;
  }

  return null;
}

interface ErrorResponse {
  error?: {
    type?: string;
    message?: string;
  };
}

function getOrganizationId(sessionKey: string): string | undefined {
  try {
    const result = execSync(
      `curl -s 'https://claude.ai/api/organizations' -H 'accept: application/json' -b 'sessionKey=${sessionKey}'`,
      { encoding: "utf-8", timeout: 10_000 },
    );
    const orgs = JSON.parse(result) as ClaudeOrganization[];
    return orgs[0]?.uuid;
  } catch {
    return undefined;
  }
}

function isSessionExpiredResponse(result: string): boolean {
  try {
    const parsed = JSON.parse(result) as ErrorResponse;
    return (
      parsed.error?.type === "authentication_error" ||
      (parsed.error?.message?.includes("unauthorized") ?? false) ||
      (parsed.error?.message?.includes("session") ?? false)
    );
  } catch {
    return result.includes("401") || result.includes("unauthorized");
  }
}

export async function getClaudeWebUsage(): Promise<ClaudeWebUsageResponse | null> {
  // Check cache
  if (usageCache && Date.now() - usageCache.timestamp < CACHE_DURATION_MS) {
    return Promise.resolve(usageCache.data);
  }

  const config = getClaudeWebConfig();
  if (!config?.sessionKey) {
    usageCache = { data: null, timestamp: Date.now() };
    return Promise.resolve(null);
  }

  // Get org ID if needed
  let orgId = config.organizationId;
  if (!orgId) {
    orgId = getOrganizationId(config.sessionKey);
    if (orgId && configCache) {
      configCache.organizationId = orgId;
      saveConfigToFile(configCache);
    }
  }

  if (!orgId) {
    usageCache = { data: null, timestamp: Date.now(), sessionExpired: true };
    return null;
  }

  try {
    const result = execSync(
      `curl -s 'https://claude.ai/api/organizations/${orgId}/usage' -H 'accept: application/json' -b 'sessionKey=${config.sessionKey}'`,
      { encoding: "utf-8", timeout: 10_000 },
    );

    if (isSessionExpiredResponse(result)) {
      handleSessionExpired();
      usageCache = { data: null, timestamp: Date.now(), sessionExpired: true };
      return null;
    }

    const data = JSON.parse(result) as ClaudeWebUsageResponse;
    usageCache = { data, timestamp: Date.now(), sessionExpired: false };
    return data;
  } catch {
    usageCache = { data: null, timestamp: Date.now() };
    return null;
  }
}

function handleSessionExpired(): void {
  configCache = null;

  // Try to refresh from browser
  const now = Date.now();
  if (now - lastSessionCheck > SESSION_CHECK_INTERVAL_MS) {
    lastSessionCheck = now;
    const extracted = extractSessionFromBrowser();
    if (extracted?.sessionKey) {
      configCache = {
        sessionKey: extracted.sessionKey,
        organizationId: extracted.organizationId,
      };
      saveConfigToFile(configCache);
    }
  }
}

export function clearClaudeWebCache(): void {
  usageCache = null;
  configCache = null;
  lastSessionCheck = 0;
}

export function isClaudeWebAvailable(): boolean {
  return getClaudeWebConfig() !== null;
}

export function isSessionExpired(): boolean {
  return usageCache?.sessionExpired === true;
}

export function getClaudeWebUsageSync(): ClaudeWebUsageResponse | null {
  // Check cache first
  if (usageCache && Date.now() - usageCache.timestamp < CACHE_DURATION_MS) {
    return usageCache.data;
  }

  const config = getClaudeWebConfig();
  if (!config?.sessionKey) {
    usageCache = { data: null, timestamp: Date.now() };
    return null;
  }

  let orgId = config.organizationId;
  if (!orgId) {
    orgId = getOrganizationId(config.sessionKey);
    if (orgId && configCache) {
      configCache.organizationId = orgId;
      saveConfigToFile(configCache);
    }
  }

  if (!orgId) {
    usageCache = { data: null, timestamp: Date.now(), sessionExpired: true };
    return null;
  }

  try {
    const result = execSync(
      `curl -s 'https://claude.ai/api/organizations/${orgId}/usage' -H 'accept: application/json' -b 'sessionKey=${config.sessionKey}'`,
      { encoding: "utf-8", timeout: 10_000 },
    );

    if (isSessionExpiredResponse(result)) {
      handleSessionExpired();
      usageCache = { data: null, timestamp: Date.now(), sessionExpired: true };
      return null;
    }

    const data = JSON.parse(result) as ClaudeWebUsageResponse;
    usageCache = { data, timestamp: Date.now(), sessionExpired: false };
    return data;
  } catch {
    usageCache = { data: null, timestamp: Date.now() };
    return null;
  }
}

export function getTimeUntilReset(): string | null {
  if (!usageCache?.data?.five_hour?.resets_at) {
    return null;
  }

  const resetTime = new Date(usageCache.data.five_hour.resets_at).getTime();
  const now = Date.now();
  const diffMs = resetTime - now;

  if (diffMs <= 0) {
    return "now";
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
    return "now";
  }

  // Format as HH:MM in local timezone
  const hours = resetTime.getHours().toString().padStart(2, "0");
  const minutes = resetTime.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}
