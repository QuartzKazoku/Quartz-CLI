import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mock } from 'bun:test';
import { promises as fs } from 'fs';
import path from 'path';
import { generatePR } from '../cli/commands/pr';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

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
      default: mock(() => ({
        chat: {
          completions: {
            create: mock(() => Promise.resolve({
              choices: [{
                message: {
                  content: JSON.stringify({
                    title: 'Add new feature',
                    body: 'This PR adds a new feature to improve functionality'
                  })
                }
              }]
            }))
          }
        }
      }))
    }));
    
    // Mock global fetch for GitHub API
    global.fetch = mock(() => Promise.resolve({
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

  it('should generate PR description', async () => {
    await generatePR([]);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle auto PR creation', async () => {
    await generatePR(['--auto']);
    
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
    await generatePR(['-a', '-b', 'develop']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should show error when no API key is provided', async () => {
    delete process.env.OPENAI_API_KEY;
    
    await generatePR([]);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle same branch error', async () => {
    // Mock git branch to return main
    mock.module('bun', () => ({
      $: {
        text: mock((cmd: string) => {
          if (cmd.includes('branch --show-current')) {
            return Promise.resolve('main');
          }
          return Promise.resolve('test-diff-content');
        }),
      },
    }));
    
    await generatePR(['--base', 'main']);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle no diff error', async () => {
    // Mock git diff to return empty
    mock.module('bun', () => ({
      $: {
        text: mock((cmd: string) => {
          if (cmd.includes('branch --show-current')) {
            return Promise.resolve('feature-branch');
          }
          if (cmd.includes('diff')) {
            return Promise.resolve('');
          }
          return Promise.resolve('test-content');
        }),
      },
    }));
    
    await generatePR([]);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    // Mock OpenAI to throw an error
    mock.module('openai', () => ({
      default: mock(() => ({
        chat: {
          completions: {
            create: mock(() => Promise.reject(new Error('API Error')))
          }
        }
      }))
    }));
    
    await generatePR([]);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle GitHub API errors', async () => {
    // Mock fetch to return an error
    global.fetch = mock(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({
        message: 'API Error'
      })
    })) as any;
    
    await generatePR(['--auto']);
    
    expect(console.error).toHaveBeenCalled();
  });
});