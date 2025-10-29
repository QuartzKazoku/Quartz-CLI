//tests/pr.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generatePR } from '@/app/commands/pr';

// Mock ConfigManager
vi.mock('@/manager/config', () => ({
  getConfigManager: vi.fn(() => ({
    readConfig: vi.fn(() => ({
      openai: {
        apiKey: 'test-api-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
      },
      platforms: [
        {
          type: 'github',
          url: 'https://github.com',
          token: 'test-github-token',
        },
      ],
      language: {
        ui: 'en',
        prompt: 'en',
      },
    })),
    getPlatformConfigs: vi.fn(() => [
      {
        type: 'github',
        url: 'https://github.com',
        token: 'test-github-token',
      },
    ]),
  })),
}));

// Mock shell module
vi.mock('@/utils/shell', () => ({
  $: vi.fn((strings: TemplateStringsArray) => {
    const command = strings[0];
    return {
      text: async () => {
        if (command.includes('branch --show-current')) {
          return 'feature-branch';
        }
        if (command.includes('diff')) {
          return 'test diff content';
        }
        if (command.includes('log')) {
          return 'feat: test commit';
        }
        if (command.includes('--name-only')) {
          return 'test.ts';
        }
        if (command.includes('remote get-url')) {
          return 'git@github.com:test/repo.git';
        }
        if (command.includes('ls-remote')) {
          return 'refs/heads/feature-branch';
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
        content: JSON.stringify({
          title: 'Test PR Title',
          body: 'Test PR Body'
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
    section: vi.fn(),
    error: vi.fn(),
    line: vi.fn(),
    keyValue: vi.fn(),
    listItem: vi.fn(),
    spinner: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn()
    })),
    box: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    separator: vi.fn(),
    text: {
      primary: (text: string) => text
    }
  }
}));

// Mock enquirer
vi.mock('@/utils/enquirer', () => ({
  select: vi.fn().mockResolvedValue(0)
}));

describe('PR Command', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    
    // Mock globalThis fetch for GitHub API
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        html_url: 'https://github.com/test/repo/pull/1'
      })
    } as Response));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate and create PR with base branch', async () => {
    await generatePR(['--base', 'main']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.section).toHaveBeenCalled();
    expect(logger.success).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle custom base branch flag', async () => {
    await generatePR(['--base', 'develop']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.section).toHaveBeenCalled();
  });

  it('should handle GitHub CLI flag for PR creation', async () => {
    await generatePR(['--gh']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.section).toHaveBeenCalled();
  });

  it('should handle short base branch flag', async () => {
    await generatePR(['-b', 'develop']);
    
    const { logger } = await import('@/utils/logger');
    expect(logger.section).toHaveBeenCalled();
  });

  it('should detect and prevent same branch PR', async () => {
    const shellModule = await import('@/utils/shell');
    vi.spyOn(shellModule, '$').mockImplementation((() => ({
      text: async () => 'main'
    })) as any);

    await generatePR(['--base', 'main']);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle no diff between branches', async () => {
    const shellModule = await import('@/utils/shell');
    vi.spyOn(shellModule, '$').mockImplementation((strings: TemplateStringsArray) => {
      const command = strings[0];
      return {
        text: async () => {
          if (command.includes('diff')) return '';
          if (command.includes('branch --show-current')) return 'feature';
          return 'test';
        }
      };
    } as any);

    await generatePR(['--base', 'main']);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle OpenAI API errors gracefully', async () => {
    const OpenAI = (await import('openai')).default;
    const mockInstance = new OpenAI({ apiKey: 'test' });
    vi.spyOn(mockInstance.chat.completions, 'create').mockRejectedValueOnce(
      new Error('API connection failed')
    );

    await generatePR(['--base', 'main']);
    const { logger } = await import('@/utils/logger');
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle GitHub API creation errors', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: false,
      statusText: 'Validation Failed',
      json: () => Promise.resolve({
        message: 'Validation Failed',
        errors: [{ message: 'Pull request already exists' }]
      })
    } as Response));

    await generatePR(['--base', 'main']);
    const { logger } = await import('@/utils/logger');
    expect(logger.error).toHaveBeenCalled();
  });

  it('should parse commit messages correctly', async () => {
    const shellModule = await import('@/utils/shell');
    vi.spyOn(shellModule, '$').mockImplementation(((strings: TemplateStringsArray) => {
      const command = strings[0];
      return {
        text: async () => {
          if (command.includes('log')) return 'feat: add feature\nfix: bug fix';
          if (command.includes('branch --show-current')) return 'feature';
          if (command.includes('diff')) return 'test diff';
          return 'test';
        }
      };
    }) as any);

    await generatePR(['--base', 'main']);
    const { logger } = await import('@/utils/logger');
    expect(logger.section).toHaveBeenCalled();
  });
});