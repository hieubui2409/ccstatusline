import {
    existsSync,
    readFileSync
} from 'node:fs';
import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import { getMcpServerCount } from '../mcp';

vi.mock('node:fs', () => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn()
}));

const mockedExistsSync = existsSync as ReturnType<typeof vi.fn>;
const mockedReadFileSync = readFileSync as ReturnType<typeof vi.fn>;

describe('mcp utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.CLAUDE_CONFIG_DIR;
    });

    describe('getMcpServerCount()', () => {
        it('should return active and total count when servers are configured', () => {
            mockedExistsSync.mockReturnValueOnce(true);
            mockedReadFileSync.mockReturnValueOnce(
                JSON.stringify({
                    mcpServers: {
                        filesystem: {
                            command: 'npx',
                            args: ['@modelcontextprotocol/server-filesystem', '/tmp']
                        },
                        brave: {
                            command: 'npx',
                            args: ['@modelcontextprotocol/server-brave']
                        },
                        postgres: {
                            command: 'npx',
                            args: ['@modelcontextprotocol/server-postgres'],
                            disabled: true
                        }
                    }
                })
            );

            const result = getMcpServerCount();

            expect(result).toEqual({
                active: 2,
                total: 3
            });
        });

        it('should return null when settings file does not exist', () => {
            mockedExistsSync.mockReturnValueOnce(false);

            const result = getMcpServerCount();

            expect(result).toBeNull();
        });

        it('should return all active when no servers are disabled', () => {
            mockedExistsSync.mockReturnValueOnce(true);
            mockedReadFileSync.mockReturnValueOnce(
                JSON.stringify({
                    mcpServers: {
                        filesystem: {
                            command: 'npx',
                            args: ['@modelcontextprotocol/server-filesystem', '/tmp']
                        },
                        brave: {
                            command: 'npx',
                            args: ['@modelcontextprotocol/server-brave']
                        }
                    }
                })
            );

            const result = getMcpServerCount();

            expect(result).toEqual({
                active: 2,
                total: 2
            });
        });

        it('should return 0 active when all servers are disabled', () => {
            mockedExistsSync.mockReturnValueOnce(true);
            mockedReadFileSync.mockReturnValueOnce(
                JSON.stringify({
                    mcpServers: {
                        filesystem: {
                            command: 'npx',
                            disabled: true
                        },
                        brave: {
                            command: 'npx',
                            disabled: true
                        }
                    }
                })
            );

            const result = getMcpServerCount();

            expect(result).toEqual({
                active: 0,
                total: 2
            });
        });

        it('should return 0/0 when mcpServers is empty object', () => {
            mockedExistsSync.mockReturnValueOnce(true);
            mockedReadFileSync.mockReturnValueOnce(
                JSON.stringify({ mcpServers: {} })
            );

            const result = getMcpServerCount();

            expect(result).toEqual({
                active: 0,
                total: 0
            });
        });

        it('should return 0/0 when mcpServers is not defined', () => {
            mockedExistsSync.mockReturnValueOnce(true);
            mockedReadFileSync.mockReturnValueOnce(JSON.stringify({}));

            const result = getMcpServerCount();

            expect(result).toEqual({
                active: 0,
                total: 0
            });
        });

        it('should return null when JSON parse fails', () => {
            mockedExistsSync.mockReturnValueOnce(true);
            mockedReadFileSync.mockReturnValueOnce('invalid json {');

            const result = getMcpServerCount();

            expect(result).toBeNull();
        });

        it('should return null when file read throws error', () => {
            mockedExistsSync.mockReturnValueOnce(true);
            mockedReadFileSync.mockImplementationOnce(() => {
                throw new Error('Permission denied');
            });

            const result = getMcpServerCount();

            expect(result).toBeNull();
        });

        it('should respect CLAUDE_CONFIG_DIR environment variable', () => {
            process.env.CLAUDE_CONFIG_DIR = '/custom/config/dir';
            mockedExistsSync.mockReturnValueOnce(true);
            mockedReadFileSync.mockReturnValueOnce(
                JSON.stringify({ mcpServers: { server1: { command: 'test' } } })
            );

            getMcpServerCount();

            // Should use the custom directory in the path
            expect(mockedReadFileSync).toHaveBeenCalledWith(
                expect.stringContaining('custom/config/dir'),
                'utf-8'
            );
        });

        it('should handle servers with missing disabled property as active', () => {
            mockedExistsSync.mockReturnValueOnce(true);
            mockedReadFileSync.mockReturnValueOnce(
                JSON.stringify({
                    mcpServers: {
                        server1: { command: 'test' }, // No disabled property
                        server2: { command: 'test', disabled: false },
                        server3: { command: 'test', disabled: true }
                    }
                })
            );

            const result = getMcpServerCount();

            expect(result).toEqual({
                active: 2,
                total: 3
            });
        });

        it('should handle nested settings structure correctly', () => {
            mockedExistsSync.mockReturnValueOnce(true);
            mockedReadFileSync.mockReturnValueOnce(
                JSON.stringify({
                    otherSettings: { foo: 'bar' },
                    mcpServers: { server1: { command: 'test', args: ['arg1', 'arg2'] } },
                    moreSettings: { baz: 'qux' }
                })
            );

            const result = getMcpServerCount();

            expect(result).toEqual({
                active: 1,
                total: 1
            });
        });
    });
});