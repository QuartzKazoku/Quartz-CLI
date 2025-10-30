//tests/changelog.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateChangelog } from '@/app/commands/changelog';
import fs from 'node:fs';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock fs
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue('# Changelog\n\n## [1.0.0]\n'),
    writeFileSync: vi.fn(),
  }
}));

// Mock shell module
vi.mock('@/utils/shell', () => ({
  $: vi.fn((strings: TemplateStringsArray) => {
    const command = strings[0];
    return {
      text: async () => {
        if (command.includes('git tag')) {
          return 'v1.0.0\nv0.9.0';
        }
        if (command.includes('git log')) {
          return 'feat: add new feature\nfix: bug fix\ndocs: update readme';
        }
        return '';
      },
      quiet: async () => {}
    };
  })
}));

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({
    stdout: 'abc123|||feat: add feature|||John Doe|||2024-01-01\ndef456|||fix: bug fix|||Jane Doe|||2024-01-02'
  })
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    line: vi.fn(),
    section: vi.fn(),
    separator: vi.fn(),
    spinner: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn(),
      stop: vi.fn()
    })),
    text: {
      dim: (text: string) => text,
      primary: (text: string) => text
    }
  }
}));

describe('Changelog Command', () => {
  beforeEach(() => {
    console.log = vi.fn();
    console.error = vi.fn();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  it('should generate changelog with default options', async () => {
    await generateChangelog([]);

    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
    expect(logger.success).toHaveBeenCalled();
  });

  it('should generate changelog with custom version', async () => {
    await generateChangelog(['--version', '2.0.0']);

    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should generate changelog with from tag', async () => {
    await generateChangelog(['--from', 'v1.0.0']);

    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should generate changelog with to tag', async () => {
    await generateChangelog(['--to', 'HEAD']);

    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should generate changelog with custom output path', async () => {
    await generateChangelog(['--output', 'HISTORY.md']);

    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should preview changelog without writing', async () => {
    await generateChangelog(['--preview']);

    const { logger } = await import('@/utils/logger');
    expect(logger.section).toHaveBeenCalled();
    expect(logger.separator).toHaveBeenCalled();
  });

  it('should handle short flags', async () => {
    await generateChangelog(['-v', '1.5.0', '-f', 'v1.0.0', '-p']);

    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should handle no commits gracefully', async () => {
    const execaModule = await import('execa');
    vi.spyOn(execaModule, 'execa').mockResolvedValueOnce({ stdout: '' } as any);

    await generateChangelog([]);

    const { logger } = await import('@/utils/logger');
    expect(logger.warn).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});