import { beforeAll, afterAll, beforeEach, afterEach, mock } from 'bun:test';

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

// Global test setup
beforeAll(() => {
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.OPENAI_API_KEY = 'test-api-key';
  process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1';
  process.env.OPENAI_MODEL = 'gpt-4-turbo-preview';
  process.env.GITHUB_TOKEN = 'test-github-token';
  process.env.QUARTZ_LANG = 'en';
  
  // Mock console methods to reduce noise in test output
  console.log = mock(() => {});
  console.error = mock(() => {});
  console.warn = mock(() => {});
  console.info = mock(() => {});
});

afterAll(() => {
  // Clean up environment variables
  delete process.env.NODE_ENV;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_BASE_URL;
  delete process.env.OPENAI_MODEL;
  delete process.env.GITHUB_TOKEN;
  delete process.env.QUARTZ_LANG;
  
  // Restore original console methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});