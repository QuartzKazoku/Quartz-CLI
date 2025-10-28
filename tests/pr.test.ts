//tests/pr.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generatePR } from '../app/commands/pr';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;


describe('PR Command', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
    
    // Mock process.env
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1';
    process.env.OPENAI_MODEL = 'gpt-4-turbo-preview';
    process.env.GITHUB_TOKEN = 'test-github-token';
    
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
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Clean up environment
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;
    delete process.env.GITHUB_TOKEN;
  });

  it('should generate and create PR automatically', async () => {
    await generatePR(['--base', 'main']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle base branch flag', async () => {
    await generatePR(['--base', 'develop']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle GitHub CLI flag', async () => {
    await generatePR(['--gh']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle short flags', async () => {
    await generatePR(['-b', 'develop']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should show error when no API key is provided', async () => {
    delete process.env.OPENAI_API_KEY;
    
    await generatePR(['--base', 'main']);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle same branch error', async () => {
    // Mock git branch to return main
    const mockTextFn = (cmd: string) => {
      if (cmd.includes('branch --show-current')) {
        return Promise.resolve('main');
      }
      return Promise.resolve('test-diff-content');
    };
    
    mock.module('bun', () => ({
      $: {
        text: mock(mockTextFn),
      },
    }));
    
    await generatePR(['--base', 'main']);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle no diff error', async () => {
    // Mock git diff to return empty
    const mockTextFn = (cmd: string) => {
      if (cmd.includes('branch --show-current')) {
        return Promise.resolve('feature-branch');
      }
      if (cmd.includes('diff')) {
        return Promise.resolve('');
      }
      return Promise.resolve('test-content');
    };
    
    mock.module('bun', () => ({
      $: {
        text: mock(mockTextFn),
      },
    }));
    
    await generatePR(['--base', 'main']);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    // Mock OpenAI to throw an error
    mock.module('openai', () => ({
      default: mock(() => createErrorOpenAIMock())
    }));
    
    await generatePR(['--base', 'main']);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle GitHub API errors', async () => {
    // Mock fetch to return an error
    globalThis.fetch = mock(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({
        message: 'API Error'
      })
    })) as any;
    
    await generatePR(['--base', 'main']);
    
    expect(console.error).toHaveBeenCalled();
  });
});