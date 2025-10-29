//tests/date.test.ts
// test/date.test.ts
import { formatDate } from '@/utils/date';

/**
 * Test function to verify formatDate output
 */
export function testDateFormatting(): void {
  console.log('=== Date Formatting Test ===');

  // Test with default parameters
  const defaultFormat = formatDate();
  console.log('Default (en):', defaultFormat);

  // Test with explicit 'en' locale
  const enFormat = formatDate('en');
  console.log('Explicit en:', enFormat);

  // Test with different locales
  const zhFormat = formatDate('zh-CN');
  console.log('zh-CN:', zhFormat);

  // Test with custom date
  const customDate = new Date('2025-10-29T12:13:05Z');
  const customFormat = formatDate('en', customDate);
  console.log('Custom date (en):', customFormat);

  // Test current date
  const now = new Date();
  console.log('Current date:', now.toISOString());
  console.log('Formatted:', formatDate('en', now));
}
testDateFormatting();