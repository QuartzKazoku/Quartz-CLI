//tests/commit.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateCommit } from '@/app/commands/commit';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

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
        return '';
      },
      quiet: async () => {}
    };
  })
}));

// Mock OpenAI
vi.mock('openai', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: 'feat: test commit message'
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
    success: vi.fn(),
    line: vi.fn(),
    listItem: vi.fn(),
    separator: vi.fn(),
    log: vi.fn(),
    spinner: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn()
    })),
    warn: vi.fn()
  }
}));

// Mock enquirer
vi.mock('@/utils/enquirer', () => ({
  selectFromList: vi.fn().mockResolvedValue(0),
  formatCommitMessage: vi.fn((msg: string) => msg)
}));

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
}));

describe('Commit Command', () => {
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

  it('should generate commit message successfully', async () => {
    await generateCommit([]);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
    expect(logger.spinner).toHaveBeenCalled();
  });

  it('should handle auto commit flag correctly', async () => {
    await generateCommit(['--auto']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should handle edit commit flag correctly', async () => {
    await generateCommit(['--edit']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should handle combined short flags', async () => {
    await generateCommit(['-a', '-e']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should handle empty staged files gracefully', async () => {
    const shellModule = await import('@/utils/shell');
    
    // Mock $ to return empty string causing the function to exit
    vi.spyOn(shellModule, '$').mockImplementation((() => ({
      text: async () => '',
      quiet: async () => {}
    })) as any);

    // The function should exit when no staged files found
    try {
      await generateCommit([]);
    } catch (error) {
      // Expected to throw or exit
    }
    
    const { logger } = await import('@/utils/logger');
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle git diff errors gracefully', async () => {
    const shellModule = await import('@/utils/shell');
    
    vi.spyOn(shellModule, '$').mockImplementation((() => ({
      text: async () => {
        throw new Error('Git diff failed');
      },
      quiet: async () => {}
    })) as any);

    await expect(generateCommit([])).rejects.toThrow();
  });

  it('should handle OpenAI API errors gracefully', async () => {
    const OpenAI = (await import('openai')).default;
    const mockInstance = new OpenAI({ apiKey: 'test' });
    vi.spyOn(mockInstance.chat.completions, 'create').mockRejectedValueOnce(
      new Error('API connection failed')
    );

    try {
      await generateCommit([]);
    } catch (error) {
      // Expected to exit
    }
    
    const { logger } = await import('@/utils/logger');
    expect(logger.error).toHaveBeenCalled();
  });
});