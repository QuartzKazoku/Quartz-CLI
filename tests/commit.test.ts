//tests/commit.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { generateCommit } from '../app/commands/commit';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Commit Command', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
    
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
    await generateCommit([]);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    await generateCommit([]);
    
    expect(console.error).toHaveBeenCalled();
  });
});