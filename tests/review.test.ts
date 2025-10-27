import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mock } from 'bun:test';
import { promises as fs } from 'fs';
import path from 'path';
import { reviewCode } from '../cli/commands/review';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('Review Command', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = mock(() => {});
    console.error = mock(() => {});
    console.warn = mock(() => {});
    
    // Mock process.env
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1';
    process.env.OPENAI_MODEL = 'gpt-4-turbo-preview';
    
    // Mock process.exit
    mock.module('process', () => ({
      ...process,
      exit: mock(() => {}),
    }));
    
    // Mock fs.existsSync and fs.readFileSync
    mock.module('fs', () => ({
      existsSync: mock(() => true),
      readFileSync: mock(() => 'OPENAI_API_KEY=test-api-key\nOPENAI_BASE_URL=https://api.openai.com/v1\nOPENAI_MODEL=gpt-4-turbo-preview'),
      writeFileSync: mock(() => {}),
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
                    comments: [
                      {
                        line: 10,
                        severity: 'warning',
                        message: 'Consider using const instead of let',
                        suggestion: 'Replace let with const for better immutability'
                      }
                    ]
                  })
                }
              }]
            }))
          }
        }
      }))
    }));
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    
    // Clean up environment
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;
  });

  it('should review code', async () => {
    await reviewCode([]);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle specific files flag', async () => {
    await reviewCode(['--files', 'file1.ts', 'file2.ts']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle output flag', async () => {
    await reviewCode(['--output', 'review-result.json']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle short flags', async () => {
    await reviewCode(['-f', 'file1.ts', '-o', 'result.json']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should show error when no API key is provided', async () => {
    delete process.env.OPENAI_API_KEY;
    
    await reviewCode([]);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle no files to review', async () => {
    // Mock git diff to return empty
    mock.module('bun', () => ({
      $: {
        text: mock(() => Promise.resolve('')),
      },
    }));
    
    await reviewCode([]);
    
    expect(console.log).toHaveBeenCalled();
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
    
    await reviewCode([]);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle file not found errors', async () => {
    // Mock fs.existsSync to return false
    mock.module('fs', () => ({
      existsSync: mock(() => false),
      readFileSync: mock(() => 'OPENAI_API_KEY=test-api-key\nOPENAI_BASE_URL=https://api.openai.com/v1\nOPENAI_MODEL=gpt-4-turbo-preview'),
      writeFileSync: mock(() => {}),
    }));
    
    await reviewCode(['--files', 'nonexistent.ts']);
    
    expect(console.warn).toHaveBeenCalled();
  });

  it('should handle git errors', async () => {
    // Mock git commands to throw an error
    mock.module('bun', () => ({
      $: {
        text: mock(() => Promise.reject(new Error('Git command failed'))),
      },
    }));
    
    await reviewCode([]);
    
    expect(console.error).toHaveBeenCalled();
  });
});