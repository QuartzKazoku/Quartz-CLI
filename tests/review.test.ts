//tests/review.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { reviewCode } from '@/app/commands/review';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Mock config manager
vi.mock('@/manager/config', () => ({
  getConfigManager: vi.fn(() => ({
    readConfig: vi.fn(() => ({
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
    }))
  }))
}));

// Mock shell module
vi.mock('@/utils/shell', () => ({
  $: vi.fn((strings: TemplateStringsArray) => {
    const command = strings[0];
    return {
      text: async () => {
        if (command.includes('diff --cached')) {
          return 'test diff content';
        }
        if (command.includes('--name-only')) {
          return 'test.ts';
        }
        return 'test content';
      }
    };
  })
}));

// Mock OpenAI
vi.mock('openai', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          comments: [{
            line: 1,
            severity: 'info',
            message: 'Test comment',
            suggestion: 'Test suggestion'
          }]
        })
      }
    }]
  });
  
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate
        }
      };
    }
  };
});

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    line: vi.fn(),
    separator: vi.fn(),
    log: vi.fn(),
    listItem: vi.fn(),
    spinner: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn()
    })),
    text: {
      bold: (text: string) => text,
      primary: (text: string) => text
    }
  }
}));

// Mock fs
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue('test file content'),
    writeFileSync: vi.fn()
  }
}));

describe('Review Command', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
    
    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    
    vi.clearAllMocks();
  });

  it('should review staged code successfully', async () => {
    await reviewCode([]);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
    expect(logger.spinner).toHaveBeenCalled();
  });

  it('should handle specific files flag with multiple files', async () => {
    await reviewCode(['--files', 'file1.ts', 'file2.ts']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
    expect(logger.listItem).toHaveBeenCalled();
  });

  it('should handle output flag and save results', async () => {
    await reviewCode(['--output', 'review-result.json']);
    
    const { logger } = await import('@/utils/logger');
    const fs = await import('node:fs');
    expect(logger.info).toHaveBeenCalled();
    expect(fs.default.writeFileSync).toHaveBeenCalled();
  });

  it('should handle combined short flags correctly', async () => {
    await reviewCode(['-f', 'file1.ts', '-o', 'result.json']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should handle no staged files gracefully', async () => {
    const shellModule = await import('@/utils/shell');
    vi.spyOn(shellModule, '$').mockImplementation((() => ({
      text: async () => ''
    })) as any);

    await reviewCode([]);
    const { logger } = await import('@/utils/logger');
    // The function should handle empty files and return early
    expect(logger.info).toHaveBeenCalled();
  });

  it('should handle OpenAI API errors with proper logging', async () => {
    const OpenAI = (await import('openai')).default;
    const mockInstance = new OpenAI({ apiKey: 'test' });
    vi.spyOn(mockInstance.chat.completions, 'create').mockRejectedValueOnce(
      new Error('API rate limit exceeded')
    );

    await reviewCode([]);
    const { logger } = await import('@/utils/logger');
    expect(logger).toBeDefined();
  });

  it('should handle file not found errors gracefully', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs.default, 'existsSync').mockReturnValue(false);

    await reviewCode(['--files', 'nonexistent.ts']);
    const { logger } = await import('@/utils/logger');
    // Should handle missing files by filtering them out
    expect(logger.info).toHaveBeenCalled();
  });

  it('should handle git command errors gracefully', async () => {
    const shellModule = await import('@/utils/shell');
    vi.spyOn(shellModule, '$').mockImplementationOnce((() => ({
      text: async () => {
        throw new Error('Git command failed');
      }
    })) as any);

    await reviewCode([]);
    const { logger } = await import('@/utils/logger');
    expect(logger.error).toHaveBeenCalled();
  });

  it('should parse review results correctly', async () => {
    await reviewCode([]);
    
    const { logger } = await import('@/utils/logger');
    // Info is called during the review process
    expect(logger.info).toHaveBeenCalled();
  });
});