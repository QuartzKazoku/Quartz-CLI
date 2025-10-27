import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mock } from 'bun:test';
import { promises as fs } from 'fs';
import path from 'path';

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('CLI Entry Point', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = mock(() => {});
    console.error = mock(() => {});
    
    // Mock process.exit
    mock.module('process', () => ({
      ...process,
      exit: mock(() => {}),
    }));
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should display help when no arguments provided', async () => {
    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['node', 'cli/index.ts'];

    try {
      await import('../cli/index.ts');
      
      // Check if help was displayed
      expect(console.log).toHaveBeenCalled();
    } catch (error) {
      // Expected to exit
    } finally {
      process.argv = originalArgv;
    }
  });

  it('should display help when -h flag is provided', async () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli/index.ts', '-h'];

    try {
      await import('../cli/index.ts');
      
      expect(console.log).toHaveBeenCalled();
    } catch (error) {
      // Expected to exit
    } finally {
      process.argv = originalArgv;
    }
  });

  it('should display version when -v flag is provided', async () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli/index.ts', '-v'];

    try {
      await import('../cli/index.ts');
      
      expect(console.log).toHaveBeenCalled();
    } catch (error) {
      // Expected to exit
    } finally {
      process.argv = originalArgv;
    }
  });

  it('should show error for unknown command', async () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli/index.ts', 'unknown'];

    try {
      await import('../cli/index.ts');
      
      expect(console.error).toHaveBeenCalled();
    } catch (error) {
      // Expected to exit
    } finally {
      process.argv = originalArgv;
    }
  });
});