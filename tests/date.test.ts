//tests/date.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from '@/utils/date';

describe('Date Formatting', () => {
  it('should format date with default locale', () => {
    const formatted = formatDate();
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('should format date with English locale', () => {
    const formatted = formatDate('en');
    expect(formatted).toBeDefined();
    expect(formatted).toMatch(/\d{2}-\d{2}-\d{4}/);
  });

  it('should format date with Chinese locale', () => {
    const formatted = formatDate('zh-CN');
    expect(formatted).toBeDefined();
    expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('should format custom date', () => {
    const customDate = new Date('2025-10-29T12:13:05Z');
    const formatted = formatDate('en', customDate);
    expect(formatted).toBeDefined();
    expect(formatted).toContain('2025');
  });

  it('should handle different locales consistently', () => {
    const date = new Date('2025-10-29T12:00:00Z');
    const enFormat = formatDate('en', date);
    const zhFormat = formatDate('zh-CN', date);
    
    expect(enFormat).toBeDefined();
    expect(zhFormat).toBeDefined();
    expect(enFormat).not.toBe(zhFormat);
  });
});