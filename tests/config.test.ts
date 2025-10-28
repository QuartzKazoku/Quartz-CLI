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

  it('should list all configurations', async () => {
    await configCommand(['list']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.line).toHaveBeenCalled();
  });

  it('should show help when no subcommand provided', async () => {
    await configCommand([]);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.line).toHaveBeenCalled();
  });

  it('should show help when help flag is provided', async () => {
    await configCommand(['help']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.line).toHaveBeenCalled();
  });

  it('should set a configuration value', async () => {
    await configCommand(['set', 'OPENAI_API_KEY', 'new-test-key']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.log).toHaveBeenCalled();
  });

  it('should get a configuration value', async () => {
    await configCommand(['get', 'OPENAI_API_KEY']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.log).toHaveBeenCalled();
  });

  it('should show error for invalid set command', async () => {
    await configCommand(['set', 'OPENAI_API_KEY']);
    
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should show error for invalid get command', async () => {
    await configCommand(['get']);
    
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should show error for unknown command', async () => {
    await configCommand(['unknown']);
    
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});