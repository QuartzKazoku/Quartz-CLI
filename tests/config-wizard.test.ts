//tests/config-wizard.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readQuartzConfig, writeQuartzConfig, upsertPlatformConfig } from '@/utils/config';

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

describe('Config Wizard - API Key Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should preserve apiKey when updating platform tokens', () => {
    
    // Initial config with apiKey
    const initialConfig = {
      openai: {
        apiKey: 'sk-test-api-key-12345',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4'
      },
      platforms: [],
      language: {
        ui: 'en',
        prompt: 'en'
      }
    };

    // Write initial config
    writeQuartzConfig(initialConfig);

    // Simulate adding platform token (like in wizard)
    upsertPlatformConfig({
      type: 'github',
      token: 'ghp_test_token'
    });

    // Read config after platform update
    const updatedConfig = readQuartzConfig();

    // Verify apiKey is still present
    expect(updatedConfig.openai.apiKey).toBe('sk-test-api-key-12345');
    expect(updatedConfig.platforms.length).toBe(1);
    expect(updatedConfig.platforms[0].type).toBe('github');
    expect(updatedConfig.platforms[0].token).toBe('ghp_test_token');
  });

  it('should preserve all openai config when updating platforms', () => {
    
    // Initial config with complete openai settings
    const initialConfig = {
      openai: {
        apiKey: 'sk-test-api-key-67890',
        baseUrl: 'https://custom.api.com/v1',
        model: 'gpt-4-turbo'
      },
      platforms: [],
      language: {
        ui: 'zh-CN',
        prompt: 'en'
      }
    };

    // Write initial config
    writeQuartzConfig(initialConfig);

    // Add GitHub platform
    upsertPlatformConfig({
      type: 'github',
      token: 'ghp_token_1'
    });

    // Add GitLab platform
    upsertPlatformConfig({
      type: 'gitlab',
      token: 'glpat_token_1',
      url: 'https://gitlab.com'
    });

    // Read config after multiple platform updates
    const finalConfig = readQuartzConfig();

    // Verify all openai settings are preserved
    expect(finalConfig.openai.apiKey).toBe('sk-test-api-key-67890');
    expect(finalConfig.openai.baseUrl).toBe('https://custom.api.com/v1');
    expect(finalConfig.openai.model).toBe('gpt-4-turbo');
    
    // Verify platforms are added
    expect(finalConfig.platforms.length).toBe(2);
    expect(finalConfig.platforms.find(p => p.type === 'github')).toBeDefined();
    expect(finalConfig.platforms.find(p => p.type === 'gitlab')).toBeDefined();
  });
});