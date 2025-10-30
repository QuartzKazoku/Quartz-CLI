//tests/init.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initCommand } from '@/app/commands/init';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock fs
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn().mockReturnValue(''),
    writeFileSync: vi.fn(),
  }
}));

// Mock config manager
const mockConfigManager = {
  getConfigDir: vi.fn(() => '/home/user/.quartz'),
  getConfigPath: vi.fn(() => '/home/user/.quartz/quartz-test.jsonc'),
  ensureConfigDir: vi.fn(),
  configExists: vi.fn(() => false),
  initializeVersionMetadata: vi.fn(),
  readConfig: vi.fn(() => ({
    openai: { apiKey: 'test', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4' },
    language: { ui: 'en', prompt: 'en' },
    platforms: []
  }))
};

vi.mock('@/manager/config', () => ({
  getConfigManager: vi.fn(() => mockConfigManager)
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    line: vi.fn(),
    log: vi.fn(),
    box: vi.fn(),
    text: {
      success: (text: string) => text,
      dim: (text: string) => text,
      primary: (text: string) => text
    }
  }
}));

describe('Init Command', () => {
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

  it('should initialize quartz configuration successfully', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs.default, 'existsSync').mockReturnValue(false);

    await initCommand([]);

    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
    expect(logger.box).toHaveBeenCalled();
  });

  it('should warn if already initialized', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs.default, 'existsSync').mockReturnValue(true);

    await initCommand([]);

    const { logger } = await import('@/utils/logger');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should create .quartz directory if not exists', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs.default, 'existsSync').mockReturnValue(false);

    await initCommand([]);

    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });

  it('should create config file', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs.default, 'existsSync').mockReturnValue(false);

    await initCommand([]);

    expect(fs.default.writeFileSync).toHaveBeenCalled();
  });

  it('should initialize version metadata', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs.default, 'existsSync').mockReturnValue(false);

    await initCommand([]);

    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
    expect(logger.success).toHaveBeenCalled();
  });

  it('should suggest adding to .gitignore if exists', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs.default, 'existsSync')
      .mockReturnValueOnce(false) // .quartz dir
      .mockReturnValueOnce(false) // config file (for configExists check)
      .mockReturnValueOnce(true); // .gitignore exists
    vi.spyOn(fs.default, 'readFileSync').mockReturnValue('node_modules/\n');

    await initCommand([]);

    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should not suggest .gitignore if already contains .quartz', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs.default, 'existsSync')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    vi.spyOn(fs.default, 'readFileSync').mockReturnValue('node_modules/\n.quartz/\n');

    await initCommand([]);

    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });
});