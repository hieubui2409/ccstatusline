import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

interface McpServer {
    command?: string;
    args?: string[];
    disabled?: boolean;
}

interface ClaudeSettings { mcpServers?: Record<string, McpServer> }

export interface McpCount {
    active: number;
    total: number;
}

function getClaudeConfigDir(): string {
    return process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), '.claude');
}

export function getMcpServerCount(): McpCount | null {
    try {
        const settingsPath = path.join(getClaudeConfigDir(), 'settings.json');

        if (!fs.existsSync(settingsPath)) {
            return null;
        }

        const content = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(content) as ClaudeSettings;

        if (!settings.mcpServers) {
            return { active: 0, total: 0 };
        }

        const servers = Object.values(settings.mcpServers);
        const total = servers.length;
        const active = servers.filter(s => !s.disabled).length;

        return { active, total };
    } catch {
        return null;
    }
}