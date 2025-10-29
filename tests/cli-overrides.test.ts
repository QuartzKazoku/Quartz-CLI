//tests/cli-overrides.test.ts
import { describe, it, expect } from 'vitest';
import { parseCLIOverrides } from '@/utils/config';

describe('CLI Overrides', () => {
  it('should parse --apikey with equals sign', () => {
    const args = ['--apikey=sk-test-123'];
    const overrides = parseCLIOverrides(args);
    expect(overrides.apiKey).toBe('sk-test-123');
  });

  it('should parse --apikey with space', () => {
    const args = ['--apikey', 'sk-test-456'];
    const overrides = parseCLIOverrides(args);
    expect(overrides.apiKey).toBe('sk-test-456');
  });

  it('should parse --baseurl with equals sign', () => {
    const args = ['--baseurl=https://api.custom.com/v1'];
    const overrides = parseCLIOverrides(args);
    expect(overrides.baseUrl).toBe('https://api.custom.com/v1');
  });

  it('should parse --baseurl with space', () => {
    const args = ['--baseurl', 'https://api.example.com/v1'];
    const overrides = parseCLIOverrides(args);
    expect(overrides.baseUrl).toBe('https://api.example.com/v1');
  });

  it('should parse --model with equals sign', () => {
    const args = ['--model=gpt-4-turbo'];
    const overrides = parseCLIOverrides(args);
    expect(overrides.model).toBe('gpt-4-turbo');
  });

  it('should parse --model with space', () => {
    const args = ['--model', 'gpt-4'];
    const overrides = parseCLIOverrides(args);
    expect(overrides.model).toBe('gpt-4');
  });

  it('should parse multiple overrides', () => {
    const args = [
      '--apikey=sk-test-123',
      '--baseurl=https://api.custom.com/v1',
      '--model=gpt-4'
    ];
    const overrides = parseCLIOverrides(args);
    expect(overrides.apiKey).toBe('sk-test-123');
    expect(overrides.baseUrl).toBe('https://api.custom.com/v1');
    expect(overrides.model).toBe('gpt-4');
  });

  it('should parse mixed format overrides', () => {
    const args = [
      '--apikey', 'sk-test-789',
      '--baseurl=https://api.example.com/v1',
      '--model', 'gpt-4-turbo'
    ];
    const overrides = parseCLIOverrides(args);
    expect(overrides.apiKey).toBe('sk-test-789');
    expect(overrides.baseUrl).toBe('https://api.example.com/v1');
    expect(overrides.model).toBe('gpt-4-turbo');
  });

  it('should return empty object when no overrides', () => {
    const args = ['commit', '--edit'];
    const overrides = parseCLIOverrides(args);
    expect(overrides).toEqual({});
  });

  it('should handle overrides mixed with other arguments', () => {
    const args = [
      'commit',
      '--apikey=sk-test-123',
      '--edit',
      '--model', 'gpt-4'
    ];
    const overrides = parseCLIOverrides(args);
    expect(overrides.apiKey).toBe('sk-test-123');
    expect(overrides.model).toBe('gpt-4');
    expect(overrides.baseUrl).toBeUndefined();
  });

  it('should handle last override when duplicates exist', () => {
    const args = [
      '--apikey=sk-first',
      '--apikey=sk-second',
      '--model', 'gpt-3',
      '--model', 'gpt-4'
    ];
    const overrides = parseCLIOverrides(args);
    expect(overrides.apiKey).toBe('sk-second');
    expect(overrides.model).toBe('gpt-4');
  });
});