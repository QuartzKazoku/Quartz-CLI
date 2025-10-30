//tests/branch.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { branchCommand } from '@/app/commands/branch';

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
    })),
    getPlatformConfigs: vi.fn(() => [])
  }))
}));

// Mock shell module
vi.mock('@/utils/shell', () => ({
  $: vi.fn((strings: TemplateStringsArray) => {
    const command = strings[0];
    return {
      text: async () => {
        if (command.includes('branch --show-current')) {
          return 'main';
        }
        if (command.includes('branch --format')) {
          return 'main\nfeature/test\ndevelop';
        }
        if (command.includes('remote get-url')) {
          return 'git@github.com:user/repo.git';
        }
        if (command.includes('checkout -b')) {
          return '';
        }
        if (command.includes('branch -d') || command.includes('branch -D')) {
          return '';
        }
        return '';
      },
      quiet: async () => {}
    };
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
    listItem: vi.fn(),
    separator: vi.fn(),
    section: vi.fn(),
    spinner: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn(),
      stop: vi.fn()
    })),
    text: {
      success: (text: string) => text,
      dim: (text: string) => text,
      primary: (text: string) => text,
      bold: (text: string) => text
    },
    box: vi.fn()
  }
}));

// Mock enquirer
vi.mock('@/utils/enquirer', () => ({
  select: vi.fn().mockResolvedValue('list'),
  input: vi.fn().mockResolvedValue('feature/new-branch'),
  confirm: vi.fn().mockResolvedValue(false),
  multiselect: vi.fn().mockResolvedValue([]),
  autocompleteBranch: vi.fn().mockResolvedValue('feature/test'),
  autocompleteIssue: vi.fn().mockResolvedValue({ number: 1, title: 'Test Issue', labels: ['bug'] })
}));

describe('Branch Command', () => {
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

  it('should list branches when list action is selected', async () => {
    const enquirerModule = await import('@/utils/enquirer');
    vi.spyOn(enquirerModule, 'select').mockResolvedValueOnce('list');

    await branchCommand([]);

    const { logger } = await import('@/utils/logger');
    expect(logger.section).toHaveBeenCalled();
    expect(logger.listItem).toHaveBeenCalled();
  });

  it('should create branch with provided name', async () => {
    await branchCommand(['create', 'feature/new-feature']);

    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });

  it('should delete branch with provided name', async () => {
    await branchCommand(['delete', 'feature/old-feature']);

    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });

  it('should list branches with list subcommand', async () => {
    await branchCommand(['list']);

    const { logger } = await import('@/utils/logger');
    expect(logger.section).toHaveBeenCalled();
  });

  it('should use short alias for create', async () => {
    await branchCommand(['c', 'feature/new']);

    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });

  it('should use short alias for delete', async () => {
    await branchCommand(['d', 'feature/old']);

    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });

  it('should use short alias for list', async () => {
    await branchCommand(['l']);

    const { logger } = await import('@/utils/logger');
    expect(logger.section).toHaveBeenCalled();
  });

  it('should handle force delete flag', async () => {
    await branchCommand(['delete', 'feature/branch', '--force']);

    const { logger } = await import('@/utils/logger');
    expect(logger.success).toHaveBeenCalled();
  });

  it('should handle unknown subcommand', async () => {
    await branchCommand(['unknown']);

    const { logger } = await import('@/utils/logger');
    expect(logger.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should start interactive create when create without name', async () => {
    const enquirerModule = await import('@/utils/enquirer');
    vi.spyOn(enquirerModule, 'input').mockResolvedValueOnce('feature/interactive');

    await branchCommand(['create']);

    const { logger } = await import('@/utils/logger');
    expect(logger.section).toHaveBeenCalled();
  });
});