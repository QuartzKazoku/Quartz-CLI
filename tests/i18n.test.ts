//tests/i18n.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initLanguage, setLanguage, getLanguage, t } from '../i18n';

describe('Internationalization', () => {
  beforeEach(() => {
    // Reset language before each test
    setLanguage('en');
  });

  it('should initialize with default language', () => {
    const lang = initLanguage();
    
    expect(lang).toBe('en');
    expect(getLanguage()).toBe('en');
  });


  it('should set language manually', () => {
    setLanguage('zh-CN');
    
    expect(getLanguage()).toBe('zh-CN');
  });

  it('should not set invalid language', () => {
    const originalLang = getLanguage();
    setLanguage('invalid-lang' as any);
    
    expect(getLanguage()).toBe(originalLang);
  });

  it('should translate common keys in English', () => {
    setLanguage('en');
    
    expect(t('common.success')).toBe('✅ Success');
    expect(t('common.error')).toBe('❌ Error');
    expect(t('common.warning')).toBe('⚠️  Warning');
    expect(t('common.info')).toBe('ℹ️  Info');
  });

  it('should translate common keys in Simplified Chinese', () => {
    setLanguage('zh-CN');
    
    expect(t('common.success')).toBe('✅ 成功');
    expect(t('common.error')).toBe('❌ 错误');
    expect(t('common.warning')).toBe('⚠️  警告');
    expect(t('common.info')).toBe('ℹ️  提示');
  });

  it('should translate common keys in Traditional Chinese', () => {
    setLanguage('zh-TW');
    
    expect(t('common.success')).toBe('✅ 成功');
    expect(t('common.error')).toBe('❌ 錯誤');
    expect(t('common.warning')).toBe('⚠️  警告');
    expect(t('common.info')).toBe('ℹ️  提示');
  });

  it('should translate common keys in Japanese', () => {
    setLanguage('ja');
    
    expect(t('common.success')).toBe('✅ 成功');
    expect(t('common.error')).toBe('❌ エラー');
    expect(t('common.warning')).toBe('⚠️  警告');
    expect(t('common.info')).toBe('ℹ️  情報');
  });

  it('should translate common keys in Korean', () => {
    setLanguage('ko');
    
    expect(t('common.success')).toBe('✅ 성공');
    expect(t('common.error')).toBe('❌ 오류');
    expect(t('common.warning')).toBe('⚠️  경고');
    expect(t('common.info')).toBe('ℹ️  정보');
  });

  it('should translate nested keys', () => {
    setLanguage('en');
    
    expect(t('review.starting')).toBe('🚀 Starting local code review...\n');
    expect(t('commit.starting')).toBe('🚀 Generating Commit Message...\n');
    expect(t('pr.starting')).toBe('🚀 Generating Pull Request description...\n');
  });

  it('should translate with parameters', () => {
    setLanguage('en');
    
    expect(t('review.foundFiles', { count: 5 })).toBe('📁 Found 5 files to review:\n');
    expect(t('commit.foundStaged', { count: 3 })).toBe('📁 Found 3 staged files:\n');
  });

  it('should return key if translation not found', () => {
    setLanguage('en');
    
    expect(t('nonexistent.key')).toBe('nonexistent.key');
    expect(t('review.nonexistent')).toBe('review.nonexistent');
  });

  it('should handle multiple parameters', () => {
    setLanguage('en');
    
    expect(t('config.set', { key: 'TEST_KEY', value: 'test-value' })).toBe('✅ Set TEST_KEY=test-value');
  });

  it('should handle parameter replacement in the middle of string', () => {
    setLanguage('en');
    
    expect(t('config.notSet', { key: 'API_KEY' })).toBe('❌ API_KEY is not set');
  });
});