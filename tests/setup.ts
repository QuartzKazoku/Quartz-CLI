//tests/setup.ts
import { afterAll, beforeAll, vi } from 'vitest';

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

// Store original NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;

// Global test setup
beforeAll(() => {
  // Set NODE_ENV to test to use quartz.example.jsonc
  process.env.NODE_ENV = 'test';
  
  // Mock console methods to reduce noise in test output
  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
  console.info = vi.fn();
});

afterAll(() => {
  // Restore original NODE_ENV
  process.env.NODE_ENV = originalNodeEnv;
  
  // Restore original console methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});