import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { generatePR } from '../cli/commands/pr';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Helper function to create OpenAI mock with successful response
const createSuccessfulOpenAIMock = () => {
  const mockResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          title: 'Add new feature',
          body: 'This PR adds a new feature to improve functionality'
        })
      }
    }]
  };
  
  return {
    chat: {
      completions: {
        create: mock(() => Promise.resolve(mockResponse))
      }
    }
  };
};

// Helper function to create OpenAI mock with error
const createErrorOpenAIMock = () => {
  const mockError = new Error('API Error');
  
  return {
    chat: {
      completions: {
        create: mock(() => Promise.reject(mockError))
      }
    }
  };
};

describe('PR Command', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = mock(() => {});
    console.error = mock(() => {});
    
    // Mock process.env
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1';
    process.env.OPENAI_MODEL = 'gpt-4-turbo-preview';
    process.env.GITHUB_TOKEN = 'test-github-token';
    
    // Mock process.exit
    mock.module('process', () => ({
      ...process,
      exit: mock(() => {}),
    }));
    
    // Mock fs.existsSync and fs.readFileSync
    mock.module('fs', () => ({
      existsSync: mock(() => true),
      readFileSync: mock(() => 'OPENAI_API_KEY=test-api-key\nOPENAI_BASE_URL=https://api.openai.com/v1\nOPENAI_MODEL=gpt-4-turbo-preview\nGITHUB_TOKEN=test-github-token'),
      writeFileSync: mock(() => {}),
      unlinkSync: mock(() => {}),
    }));
    
    // Mock Bun's $ for git commands
    mock.module('bun', () => ({
      $: {
        text: mock(() => Promise.resolve('test-diff-content')),
      },
    }));
    
    // Mock OpenAI
    mock.module('openai', () => ({
      default: mock(() => createSuccessfulOpenAIMock())
    }));
    
    // Mock globalThis fetch for GitHub API
    globalThis.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        html_url: 'https://github.com/test/repo/pull/1'
      })
    })) as any;
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