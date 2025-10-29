//tests/config-isolation.test.ts
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { CONFIG_FILE } from '@/constants';

describe('Config Isolation in Test Environment', () => {
  beforeAll(() => {
    // Ensure we're in test environment
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should use test environment', () => {
    // Verify we're in test environment
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have test config constant defined', () => {
    expect(CONFIG_FILE.TEST_NAME).toBe('quartz-test.jsonc');
  });

  it('should have different test config name from production', () => {
    // Test config should be different from production config
    expect(CONFIG_FILE.TEST_NAME).not.toBe(CONFIG_FILE.NAME);
    expect(CONFIG_FILE.NAME).toBe('quartz.jsonc');
  });
});