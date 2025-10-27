import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mock } from 'bun:test';
import { promises as fs } from 'fs';
import path from 'path';
import { generateCommit } from '../cli/commands/commit';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Commit Command', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = mock(() => {});
    console.error = mock(() => {});
    
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
                  content: 'feat: add new feature\n\nThis is a test commit message'
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
    
    // Clean up environment
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;
  });

  it('should generate commit message', async () => {
    await generateCommit([]);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle auto commit flag', async () => {
    await generateCommit(['--auto']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle edit commit flag', async () => {
    await generateCommit(['--edit']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle short flags', async () => {
    await generateCommit(['-a', '-e']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should show error when no API key is provided', async () => {
    delete process.env.OPENAI_API_KEY;
    
    await generateCommit([]);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle git diff errors', async () => {
    // Mock git diff to return empty
    mock.module('bun', () => ({
      $: {
        text: mock(() => Promise.resolve('')),
      },
    }));
    
    await generateCommit([]);
    
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
    
    await generateCommit([]);
    
    expect(console.error).toHaveBeenCalled();
  });
});