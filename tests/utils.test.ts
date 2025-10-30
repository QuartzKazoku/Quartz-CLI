//tests/utils.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getReviewPrompt, getCommitPrompt, getPRPrompt, getSummaryPrompt } from '@/utils/prompt';
import { initLanguage, setLanguage, getLanguage, t } from '@/i18n';

// Mock config manager
const mockReadConfig = vi.fn(() => ({
  openai: {
    apiKey: 'test-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4'
  },
  language: {
    ui: 'en',
    prompt: 'en'
  },
  platforms: []
}));

vi.mock('@/manager/config', () => ({
  getConfigManager: vi.fn(() => ({
    readConfig: mockReadConfig
  }))
}));

describe('Utils Functions', () => {
  describe('Prompt Functions', () => {
    beforeEach(async () => {
      // Set default language to English for testing
      setLanguage('en');
    });

    it('should generate review prompt with all required fields', () => {
      const file = 'test.ts';
      const diff = 'test diff content';
      const content = 'test file content';
      
      const prompt = getReviewPrompt(file, diff, content);
      
      expect(prompt).toContain('You are a professional code review expert');
      expect(prompt).toContain(file);
      expect(prompt).toContain(diff);
      expect(prompt).toContain(content);
      expect(prompt).toContain('English');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should generate review prompt in Chinese', async () => {
      // Update mock to return Chinese config
      mockReadConfig.mockReturnValueOnce({
        openai: {
          apiKey: 'test-key',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-4'
        },
        language: {
          ui: 'zh-CN',
          prompt: 'zh-CN'
        },
        platforms: []
      });
      
      setLanguage('zh-CN');
      const prompt = getReviewPrompt('test.ts', 'diff', 'content');
      
      expect(prompt).toContain('Simplified Chinese');
      setLanguage('en');
    });

    it('should generate commit prompt with conventional commits format', () => {
      const diff = 'test diff content';
      const files = ['file1.ts', 'file2.ts'];
      
      const prompt = getCommitPrompt(diff, files);
      
      expect(prompt).toContain('You are a professional Git commit message generator');
      expect(prompt).toContain(diff);
      expect(prompt).toContain('file1.ts');
      expect(prompt).toContain('file2.ts');
      expect(prompt).toContain('Conventional Commits specification');
      expect(prompt).toContain('English');
      expect(prompt).toContain('feat:');
      expect(prompt).toContain('fix:');
    });

    it('should generate commit prompt with multiple files', () => {
      const files = ['src/app.ts', 'src/utils.ts', 'tests/app.test.ts'];
      const prompt = getCommitPrompt('diff content', files);
      
      files.forEach(file => {
        expect(prompt).toContain(file);
      });
    });

    it('should generate PR prompt with complete information', () => {
      const diff = 'test diff content';
      const commits = ['feat: add feature', 'fix: bug', 'docs: update readme'];
      const files = ['file1.ts', 'file2.ts'];
      const currentBranch = 'feature-branch';
      const baseBranch = 'main';
      
      const prompt = getPRPrompt(diff, commits, files, currentBranch, baseBranch);
      
      expect(prompt).toContain('You are a professional Pull Request description generator');
      expect(prompt).toContain(diff);
      expect(prompt).toContain('feat: add feature');
      expect(prompt).toContain('fix: bug');
      expect(prompt).toContain('docs: update readme');
      expect(prompt).toContain('file1.ts');
      expect(prompt).toContain('file2.ts');
      expect(prompt).toContain('feature-branch');
      expect(prompt).toContain('main');
      expect(prompt).toContain('English');
    });

    it('should generate PR prompt with empty commits list', () => {
      const prompt = getPRPrompt('diff', [], ['file.ts'], 'feature', 'main');
      
      expect(prompt).toContain('Pull Request description generator');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should generate summary prompt with statistics', () => {
      const errorCount = 2;
      const warningCount = 3;
      const infoCount = 1;
      const score = 75;
      
      const prompt = getSummaryPrompt(errorCount, warningCount, infoCount, score);
      
      expect(prompt).toContain('Based on the following code review results');
      expect(prompt).toContain(`${errorCount} errors`);
      expect(prompt).toContain(`${warningCount} warnings`);
      expect(prompt).toContain(`${infoCount} suggestions`);
      expect(prompt).toContain(`${score}/100`);
      expect(prompt).toContain('English');
    });

    it('should generate summary prompt with zero errors', () => {
      const prompt = getSummaryPrompt(0, 0, 0, 100);
      
      expect(prompt).toContain('0 errors');
      expect(prompt).toContain('100/100');
    });
  });

  describe('Language Functions', () => {
    beforeEach(() => {
      // Reset language before each test
      setLanguage('en');
    });

    it('should initialize language', () => {
      const lang = initLanguage();
      
      expect(typeof lang).toBe('string');
      expect(['zh-CN', 'zh-TW', 'ja', 'ko', 'en']).toContain(lang);
    });

    it('should set language', () => {
      setLanguage('zh-CN');
      
      expect(getLanguage()).toBe('zh-CN');
    });

    it('should get translation', () => {
      setLanguage('en');
      
      const translation = t('common.success');
      
      expect(translation).toBe('✅ Success');
    });

    it('should handle nested translation keys', () => {
      setLanguage('en');
      
      const translation = t('review.starting');
      
      expect(translation).toBe('🚀 Starting local code review...\n');
    });

    it('should handle translation with parameters', () => {
      setLanguage('en');
      
      const translation = t('review.foundFiles', { count: 5 });
      
      expect(translation).toBe('📁 Found 5 files to review:\n');
    });

    it('should return key if translation not found', () => {
      setLanguage('en');
      
      const translation = t('nonexistent.key');
      
      expect(translation).toBe('nonexistent.key');
    });

    it('should handle Chinese translations', () => {
      setLanguage('zh-CN');
      
      const translation = t('common.success');
      
      expect(translation).toBe('✅ 成功');
    });

    it('should handle Japanese translations', () => {
      setLanguage('ja');
      
      const translation = t('common.success');
      
      expect(translation).toBe('✅ 成功');
    });

    it('should handle Korean translations', () => {
      setLanguage('ko');
      
      const translation = t('common.success');
      
      expect(translation).toBe('✅ 성공');
    });

    it('should handle Traditional Chinese translations', () => {
      setLanguage('zh-TW');
      
      const translation = t('common.success');
      
      expect(translation).toBe('✅ 成功');
    });
  });
});