//tests/config.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configCommand } from '@/app/commands/config';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    line: vi.fn(),
    gradient: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    separator: vi.fn(),
    section: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    command: vi.fn(),
    example: vi.fn(),
    text: {
      bold: (text: string) => text,
      primary: (text: string) => text,
      dim: (text: string) => text,
      error: (text: string) => text,
      warning: (text: string) => text
    }
  }
}));

// Mock enquirer
vi.mock('@/utils/enquirer', () => ({
  select: vi.fn().mockResolvedValue('en'),
  input: vi.fn().mockResolvedValue('test-value'),
  message: vi.fn().mockResolvedValue(undefined)
}));

// Mock fs
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue(JSON.stringify({
      default: {
        openai: {
          apiKey: 'test-key',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-4'
        },
        language: {
          ui: 'en',
          prompt: 'en'
        },
        platforms: []
      }
    })),
    writeFileSync: vi.fn()
  }
}));

// Mock config utils
vi.mock('@/utils/config', () => ({
  readQuartzConfig: vi.fn(() => ({
    openai: {
      apiKey: 'test-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4'
    },
    language: {
      ui: 'en',
      prompt: 'en'
    },
    platforms: []
  })),
  writeQuartzConfig: vi.fn(),
  upsertPlatformConfig: vi.fn()
}));

describe('Config Command', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
    
    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    vi.clearAllMocks();
  });

  it('should list all configurations with details', async () => {
    await configCommand(['list']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.line).toHaveBeenCalled();
    expect(logger.section).toHaveBeenCalled();
  });

  it('should show help when no subcommand provided', async () => {
    await configCommand([]);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.line).toHaveBeenCalled();
    expect(logger.command).toHaveBeenCalled();
  });

  it('should show help when help flag is provided', async () => {
    await configCommand(['help']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.line).toHaveBeenCalled();
  });

  it('should set configuration value successfully', async () => {
    await configCommand(['set', 'OPENAI_API_KEY', 'new-test-key']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.log).toHaveBeenCalled();
    expect(logger.success).toHaveBeenCalled();
  });

  it('should get configuration value successfully', async () => {
    await configCommand(['get', 'OPENAI_API_KEY']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.log).toHaveBeenCalled();
  });

  it('should set OpenAI base URL', async () => {
    await configCommand(['set', 'OPENAI_BASE_URL', 'https://api.custom.com/v1']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });

  it('should set OpenAI model', async () => {
    await configCommand(['set', 'OPENAI_MODEL', 'gpt-4-turbo']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });

  it('should set UI language', async () => {
    await configCommand(['set', 'LANGUAGE_UI', 'zh-CN']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });

  it('should show error for invalid set command without value', async () => {
    await configCommand(['set', 'OPENAI_API_KEY']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should show error for invalid get command without key', async () => {
    await configCommand(['get']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should show error for unknown configuration key', async () => {
    await configCommand(['get', 'UNKNOWN_KEY']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.error).toHaveBeenCalled();
  });

  it('should show error for unknown subcommand', async () => {
    await configCommand(['unknown']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle platform configuration', async () => {
    await configCommand(['set', 'GITHUB_TOKEN', 'ghp_test_token']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });
});