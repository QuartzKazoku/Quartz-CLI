//tests/config-isolation.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { getQuartzPath } from '@/utils/path';
import { CONFIG_FILE } from '@/constants';

describe('Config Isolation in Test Environment', () => {
  beforeAll(() => {
    // Ensure we're in test environment
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should use quartz-test.jsonc in test environment', () => {
    const configPath = getQuartzPath();
    expect(configPath).toContain(CONFIG_FILE.TEST_NAME);
    expect(configPath).not.toContain('quartz.jsonc');
  });

  it('should use correct test config file name', () => {
    const configPath = getQuartzPath();
    expect(configPath).toMatch(/quartz-test\.jsonc$/);
  });

  it('should have test config constant defined', () => {
    expect(CONFIG_FILE.TEST_NAME).toBe('quartz-test.jsonc');
  });
});