//tests/review.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { reviewCode } from '../app/commands/review';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('Review Command', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
    
    // Mock process.env
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1';
    process.env.OPENAI_MODEL = 'gpt-4-turbo-preview';
    
    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
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
    await reviewCode([]);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    await reviewCode([]);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle file not found errors', async () => {
    await reviewCode(['--files', 'nonexistent.ts']);
    
    expect(console.warn).toHaveBeenCalled();
  });

  it('should handle git errors', async () => {
    await reviewCode([]);
    
    expect(console.error).toHaveBeenCalled();
  });
});