//tests/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mock } from 'bun:test';
import { promises as fs } from 'fs';
import path from 'path';
import { configCommand } from '../cli/commands/config';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Config Command', () => {
  const testEnvPath = path.join(process.cwd(), '.env.test');
  
  beforeEach(async () => {
    // Mock console methods
    console.log = mock(() => {});
    console.error = mock(() => {});
    
    // Create a test .env file
    await fs.writeFile(testEnvPath, `
# Test Configuration
OPENAI_API_KEY=test-key
OPENAI_BASE_URL=https://api.test.com/v1
OPENAI_MODEL=gpt-4-test
GITHUB_TOKEN=test-github-token
QUARTZ_LANG=zh-CN
    `.trim(), 'utf-8');
    
    // Mock process.cwd to return test directory
    mock.module('process', () => ({
      ...process,
      cwd: () => process.cwd(),
      exit: mock(() => {}),
    }));
    
    // Mock fs.existsSync to use test file
    mock.module('fs', () => ({
      existsSync: (filePath: string) => filePath.includes('.env.test'),
      readFileSync: (filePath: string) => {
        if (filePath.includes('.env.test')) {
          return `OPENAI_API_KEY=test-key
OPENAI_BASE_URL=https://api.test.com/v1
OPENAI_MODEL=gpt-4-test
GITHUB_TOKEN=test-github-token
QUARTZ_LANG=zh-CN`;
        }
        return '';
      },
      writeFileSync: mock(() => {}),
    }));
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Clean up test file
    fs.unlink(testEnvPath).catch(() => {});
  });

  it('should list all configurations', async () => {
    await configCommand(['list']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should show help when no subcommand provided', async () => {
    await configCommand([]);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should show help when help flag is provided', async () => {
    await configCommand(['help']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should set a configuration value', async () => {
    await configCommand(['set', 'OPENAI_API_KEY', 'new-test-key']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should get a configuration value', async () => {
    await configCommand(['get', 'OPENAI_API_KEY']);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should show error for invalid set command', async () => {
    await configCommand(['set', 'OPENAI_API_KEY']);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should show error for invalid get command', async () => {
    await configCommand(['get']);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should show error for unknown command', async () => {
    await configCommand(['unknown']);
    
    expect(console.error).toHaveBeenCalled();
  });
});